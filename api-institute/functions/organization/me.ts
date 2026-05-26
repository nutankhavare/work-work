import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool, withTenant } from "../../shared/db";
import { requireAuth } from "../../shared/auth";
import { ok, err, preflight } from "../../shared/response";
import { parseMultipart } from "../../shared/multipart";
import { uploadToBlob } from "../../shared/blob";

app.http("organizationMe", {
  route: "organization/me",
  methods: ["GET", "PUT", "OPTIONS"],
  authLevel: "anonymous",
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    if (req.method === "OPTIONS") return preflight();
    let client;
    try {
      const auth = requireAuth(req);
      if ("error" in auth) return err(401, auth.error);
      const token = auth.user;

      client = await getPool().connect();
      await withTenant(client, token.org_id);

      if (req.method === "GET") {
        // Read base org from vanloka.organizations
        let orgRes = await client.query(
          `SELECT id as org_id, name, type, email, phone, website,
                  registration_type, registration_no, registration_date,
                  gst_number, pan_number, tan_number, udyam_no,
                  subscription_plan, status, remarks, created_at
           FROM vanloka.organizations WHERE id::text = $1::text`,
          [String(token.org_id)]
        );

        if (orgRes.rows.length === 0) {
          // Fallback: If not found, try to get the first one (helpful for superadmins or dev mode)
          orgRes = await client.query("SELECT * FROM vanloka.organizations ORDER BY id ASC LIMIT 1");
        }

        if (orgRes.rows.length === 0) {
          return err(404, "Organization profile not configured");
        }
        
        const org = orgRes.rows[0];
        const actualOrgId = org.id || org.org_id;

        // Fetch address
        const addrRes = await client.query("SELECT * FROM vanloka.organization_address WHERE org_id::text = $1::text", [String(actualOrgId)]);
        org.address = addrRes.rows[0] || {};

        // Fetch contacts
        const contactRes = await client.query("SELECT * FROM vanloka.organization_contacts WHERE org_id::text = $1::text", [String(actualOrgId)]);
        org.contact = contactRes.rows[0] || {};

        // Fetch institute specific info
        const instRes = await client.query("SELECT * FROM vanloka.organization_institute WHERE org_id::text = $1::text", [String(actualOrgId)]);
        org.institute = instRes.rows[0] || {};

        // Fetch documents
        const docRes = await client.query("SELECT * FROM vanloka.organization_documents WHERE org_id::text = $1::text", [String(actualOrgId)]);
        org.documents = docRes.rows[0] || {};

        return ok(org);
      }

      if (req.method === "PUT") {
        const { fields, files } = await parseMultipart(req);
        
        const { name, website, phone, email, gst_number, pan_number, address, contact, documents, institute } = fields;

        // Parse JSON nested payloads
        const parsedAddress = address ? JSON.parse(address) : null;
        const parsedContact = contact ? JSON.parse(contact) : null;
        const parsedInstitute = institute ? JSON.parse(institute) : null;
        const docPayload = documents ? JSON.parse(documents) : {};

        // Handle file uploads (e.g. pan_card, gst_cert, registration_cert, etc.)
        const uploadFileIfPresent = async (fileKey: string, destFolder: string) => {
          const file = files[fileKey];
          if (file) {
            return await uploadToBlob(file.buffer, file.filename, file.mimetype, destFolder);
          }
          return null;
        };

        const pan_card_url = await uploadFileIfPresent('pan_card', 'organizations');
        if (pan_card_url) docPayload.pan_card = pan_card_url;

        const gst_cert_url = await uploadFileIfPresent('gst_cert', 'organizations');
        if (gst_cert_url) docPayload.gst_cert = gst_cert_url;

        const registration_cert_url = await uploadFileIfPresent('registration_cert', 'organizations');
        if (registration_cert_url) docPayload.registration_cert = registration_cert_url;

        const aadhaar_card_url = await uploadFileIfPresent('aadhaar_card', 'organizations');
        if (aadhaar_card_url) docPayload.aadhaar_card = aadhaar_card_url;

        const bank_proof_url = await uploadFileIfPresent('bank_proof', 'organizations');
        if (bank_proof_url) docPayload.bank_proof = bank_proof_url;

        const contract_doc_url = await uploadFileIfPresent('contract_doc', 'organizations');
        if (contract_doc_url) docPayload.contract_doc = contract_doc_url;

        const insurance_cert_url = await uploadFileIfPresent('insurance_cert', 'organizations');
        if (insurance_cert_url) docPayload.insurance_cert = insurance_cert_url;

        const safety_sop_url = await uploadFileIfPresent('safety_sop', 'organizations');
        if (safety_sop_url) docPayload.safety_sop = safety_sop_url;

        const additional_doc_url = await uploadFileIfPresent('additional_doc', 'organizations');
        if (additional_doc_url) docPayload.additional_doc = additional_doc_url;

        // Upsert logic inside transaction
        await client.query("BEGIN");

        const finalPhone = phone || parsedContact?.primary_phone;
        const finalEmail = email || parsedContact?.primary_email;

        // 1. Update basic org info in vanloka.organizations
        await client.query(
          `UPDATE vanloka.organizations 
           SET name = $1, website = $2, phone = $3, email = $4, gst_number = $5, pan_number = $6 
           WHERE id::text = $7::text`,
          [name, website, finalPhone, finalEmail, gst_number, pan_number, String(token.org_id)]
        );

        // 2. Upsert address
        if (parsedAddress) {
          await client.query(
            `INSERT INTO vanloka.organization_address (org_id, address1, address2, city, district, pincode, state)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (org_id) DO UPDATE SET
             address1 = EXCLUDED.address1,
             address2 = EXCLUDED.address2,
             city = EXCLUDED.city,
             district = EXCLUDED.district,
             pincode = EXCLUDED.pincode,
             state = EXCLUDED.state`,
            [Number(token.org_id), parsedAddress.address1, parsedAddress.address2, parsedAddress.city, parsedAddress.district, parsedAddress.pincode, parsedAddress.state]
          );
        }

        // 3. Upsert contact
        if (parsedContact) {
          await client.query(
            `INSERT INTO vanloka.organization_contacts (
               org_id, primary_name, primary_phone, primary_email, 
               secondary_name, secondary_phone, secondary_email,
               emergency_name, emergency_phone
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (org_id) DO UPDATE SET
             primary_name = EXCLUDED.primary_name,
             primary_phone = EXCLUDED.primary_phone,
             primary_email = EXCLUDED.primary_email,
             secondary_name = EXCLUDED.secondary_name,
             secondary_phone = EXCLUDED.secondary_phone,
             secondary_email = EXCLUDED.secondary_email,
             emergency_name = EXCLUDED.emergency_name,
             emergency_phone = EXCLUDED.emergency_phone`,
            [
              Number(token.org_id), 
              parsedContact.primary_name, parsedContact.primary_phone, parsedContact.primary_email,
              parsedContact.secondary_name, parsedContact.secondary_phone, parsedContact.secondary_email,
              parsedContact.emergency_name, parsedContact.emergency_phone
            ]
          );
        }

        // 4. Upsert documents
        if (docPayload && Object.keys(docPayload).length > 0) {
          await client.query(
            `INSERT INTO vanloka.organization_documents (
               org_id, pan_card, gst_cert, registration_cert, aadhaar_card, 
               bank_proof, contract_doc, insurance_cert, safety_sop, additional_doc
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (org_id) DO UPDATE SET
             pan_card = EXCLUDED.pan_card,
             gst_cert = EXCLUDED.gst_cert,
             registration_cert = EXCLUDED.registration_cert,
             aadhaar_card = EXCLUDED.aadhaar_card,
             bank_proof = EXCLUDED.bank_proof,
             contract_doc = EXCLUDED.contract_doc,
             insurance_cert = EXCLUDED.insurance_cert,
             safety_sop = EXCLUDED.safety_sop,
             additional_doc = EXCLUDED.additional_doc`,
            [
              Number(token.org_id),
              docPayload.pan_card || null, docPayload.gst_cert || null, docPayload.registration_cert || null, docPayload.aadhaar_card || null,
              docPayload.bank_proof || null, docPayload.contract_doc || null, docPayload.insurance_cert || null, docPayload.safety_sop || null, docPayload.additional_doc || null
            ]
          );
        }

        // 5. Upsert institute
        if (parsedInstitute) {
          const { institution_type, affiliation_board, udise_code, safety_officer_name, safety_officer_contact } = parsedInstitute;
          await client.query(
            `INSERT INTO vanloka.organization_institute (org_id, institution_type, affiliation_board, udise_code, safety_officer_name, safety_officer_contact)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (org_id) DO UPDATE SET
             institution_type = EXCLUDED.institution_type,
             affiliation_board = EXCLUDED.affiliation_board,
             udise_code = EXCLUDED.udise_code,
             safety_officer_name = EXCLUDED.safety_officer_name,
             safety_officer_contact = EXCLUDED.safety_officer_contact`,
            [Number(token.org_id), institution_type, affiliation_board, udise_code, safety_officer_name, safety_officer_contact]
          );
        }

        await client.query("COMMIT");

        // Fetch back updated details to return
        const finalRes = await client.query(
          `SELECT * FROM vanloka.organizations WHERE id::text = $1::text`,
          [String(token.org_id)]
        );
        const updatedOrg = finalRes.rows[0];
        
        const finalAddr = await client.query("SELECT * FROM vanloka.organization_address WHERE org_id::text = $1::text", [String(token.org_id)]);
        updatedOrg.address = finalAddr.rows[0] || {};
        
        const finalContact = await client.query("SELECT * FROM vanloka.organization_contacts WHERE org_id::text = $1::text", [String(token.org_id)]);
        updatedOrg.contact = finalContact.rows[0] || {};

        const finalInst = await client.query("SELECT * FROM vanloka.organization_institute WHERE org_id::text = $1::text", [String(token.org_id)]);
        updatedOrg.institute = finalInst.rows[0] || {};

        const finalDoc = await client.query("SELECT * FROM vanloka.organization_documents WHERE org_id::text = $1::text", [String(token.org_id)]);
        updatedOrg.documents = finalDoc.rows[0] || {};

        return ok(updatedOrg);
      }

      return err(405, "Method not allowed");
    } catch (e: any) {
      ctx.error(e);
      if (e.status) return err(e.status, e.message);
      return err(500, "Internal server error");
    } finally {
      client?.release();
    }
  }
});
