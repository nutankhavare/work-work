// Driver.types.ts
export interface Driver {
  id: string | number;

  // Basic Information
  first_name: string;
  last_name: string;
  gender: string;
  date_of_birth: string;
  email?: string;
  mobile_number: string;
  blood_group?: string;
  marital_status?: string;
  number_of_dependents: number;
  profile_photo?: string;

  // Emergency Contacts
  primary_person_name?: string;
  primary_person_email?: string;
  primary_person_phone_1?: string;
  primary_person_phone_2?: string;
  secondary_person_name?: string;
  secondary_person_email?: string;
  secondary_person_phone_1?: string;
  secondary_person_phone_2?: string;

  // Address
  address_line_1?: string;
  address_line_2?: string;
  landmark?: string;
  city?: string;
  district?: string;
  state?: string;
  pin_code?: string;

  // Professional Information
  employment_type?: string;
  employee_id?: string;
  safety_training_completion?: string;
  safety_training_completion_date?: string;
  medical_fitness?: string;
  medical_fitness_exp_date?: string;
  driving_experience?: number;
  police_verification?: string;
  police_verification_date?: string;

  // bank details
  bank_name?: string;
  account_holder_name?: string;
  account_number?: string;
  ifsc_code?: string;

  // License/Insurance Array
  license_insurance?: LicenseInsurance[];

  // Tracking & Assignment
  beacon_id?: string;
  vehicle?: string;

  // Documents
  driving_license?: string;
  aadhaar_card?: string;
  pan_card?: string;
  police_verification_doc?: string;
  medical_fitness_certificate?: string;
  address_proof_doc?: string;
  training_certificate_doc?: string;

  // Status
  status?: string;
  remarks?: string;

  // Timestamps
  created_at?: string;
  updated_at?: string;
}

export interface LicenseInsurance {
  id?: number;
  type?: string;
  number?: string;
  issue_date?: string;
  exp_date?: string;
}
