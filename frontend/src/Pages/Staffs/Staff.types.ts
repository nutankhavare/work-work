export interface Employee {
  id: number;
  employee_id: string;

  photo: string;

  employment_type: string;
  designation: string;
  joining_date: string; // Or use Date if converting

  first_name: string;
  last_name: string;
  gender: string; // dropdown
  marital_status: string; // dropdown
  date_of_birth: string; // dropdown
  email: string;
  phone: string;

  dependants: Dependant[]; // if marital status selected then add dependant details 

  // Address
  address_line_1: string;
  address_line_2: string;
  landmark: string;
  state: string;
  district: string;
  city: string;
  pin_code: string;

  // Emergency Contacts
  primary_person_name: string;
  primary_person_email: string;
  primary_person_phone_1: string;
  primary_person_phone_2: string;

  secondary_person_name: string;
  secondary_person_email: string;
  secondary_person_phone_1: string;
  secondary_person_phone_2: string;

  // Bank Details
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string;

  // Documents
  aadhaar_card: string;
  pan_card: string;
  bank_proof: string;

  status: string;
  remarks: string;

  roles: string[];
  beacon_id?: string;
  department?: string;
  user?: {
        roles: Array<{
            name: string;
        }>;
    };

  created_at: string;
  updated_at: string;
}


export interface Role {
  id: number;
  name: string;
}


export interface Dependant {
  fullname: string;
  relation: string;
  age: number;
  phone: string;
  email: string;
}

