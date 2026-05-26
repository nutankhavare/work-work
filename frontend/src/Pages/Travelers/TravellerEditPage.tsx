// src/components/travellers/TravellerEditPage.tsx
import { useState, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { useParams, useNavigate } from "react-router-dom";

// Icons
import { FaUserEdit, FaIdCard, } from "react-icons/fa";

// Components
import PageHeaderBack from "../../Components/UI/PageHeaderBack";
import InputField from "../../Components/Form/InputField";
import SaveButton from "../../Components/Form/SaveButton";
import LoadingSpinner from "../../Components/UI/LoadingSpinner";
import EmptyState from "../../Components/UI/EmptyState";

// Services & Context
import { useAlert } from "../../Context/AlertContext";
import type { FormDropdown } from "../../Types/Index";
import type { TravellerForm } from "./Traveler.types";
import tenantApi, { centralAsset } from "../../Services/ApiService";
import axios from "axios";
import { DUMMY_USER_IMAGE } from "../../Utils/Toolkit";
import SelectInputField from "../../Components/Form/SelectInputField";
import { useConfirm } from "../../Context/ConfirmContext";

const TravellerEditPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const confirm = useConfirm();

    // State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [genders, setGenders] = useState<FormDropdown[]>([]);
    const [relationships, setRelationships] = useState<FormDropdown[]>([]);
    const [bloodGroups, setBloodGroups] = useState<FormDropdown[]>([]);
    const [statuses, setStatuses] = useState<FormDropdown[]>([]);
    const [currentPhoto, setCurrentPhoto] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<TravellerForm>();

    // 1. Fetch Initial Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [travellerRes, genderRes, relationshipRes, bloodGroupRes, statusRes] = await Promise.all([
                    tenantApi.get(`/travellers/${id}`),
                    tenantApi.get(`/masters/forms/dropdowns/fields?type=common&field=gender`),
                    tenantApi.get(`/masters/forms/dropdowns/fields?type=common&field=relationship`),
                    tenantApi.get(`/masters/forms/dropdowns/fields?type=common&field=blood_group`),
                    tenantApi.get(`/masters/forms/dropdowns/fields?type=common&field=status`),
                ]);

                const traveller = travellerRes.data.data;
                const unwrap = (r: any) => Array.isArray(r.data) ? r.data : r.data?.data || [];

                setGenders(unwrap(genderRes));
                setRelationships(unwrap(relationshipRes));
                setBloodGroups(unwrap(bloodGroupRes));
                setStatuses(unwrap(statusRes));
                setCurrentPhoto(traveller.profile_photo);

                // Populate Form (exclude profile_photo file field)
                reset({
                    ...traveller,
                    profile_photo: undefined
                });

            } catch (err: any) {
                console.error(err);
                setError(err.response?.data?.message || "Failed to load traveller data.");
                showAlert("Failed to load data.", "error");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchData();
    }, [id, reset, showAlert]);


    // 2. Submit Handler
    const onSubmit: SubmitHandler<TravellerForm> = async (data) => {
        if (!(await confirm("Are you sure you want to save changes to this traveller record?"))) return;
        try {
            const formData = new FormData();

            // Append Simple Fields
            Object.keys(data).forEach((key) => {
                const k = key as keyof TravellerForm;
                const value = data[k];

                if (k === 'profile_photo') return;


                if (value !== undefined && value !== null && value !== '') {
                    formData.append(k, String(value));
                } else {
                    formData.append(k, "");
                }

            });

            const response = await tenantApi.post(`/travellers/update/${id}`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            showAlert(response.data.message || "Traveller updated successfully!", "success");
        } catch (err: any) {
            console.error("Validation errors:", err.response?.data?.errors);

            // Display validation errors
            if (err.response?.status === 422 && err.response?.data?.errors) {
                const errors = err.response.data.errors;

                // Show first error message
                const firstError = Object.values(errors)[0];
                showAlert(Array.isArray(firstError) ? firstError[0] : firstError, "error");

                // Optional: Log all errors for debugging
                Object.entries(errors).forEach(([field, messages]) => {
                    console.log(`${field}:`, messages);
                });
            } else {
                const msg = err.response?.data?.message || "Failed to update traveller.";
                showAlert(msg, "error");
            }
        }
    };

    if (loading) return <LoadingSpinner fullScreen />;
    if (error) return <div className="p-4"><EmptyState title="Error" description={error} /></div>;

    const displayPhoto = currentPhoto ? `${centralAsset}${currentPhoto}` : `${DUMMY_USER_IMAGE}`;

    return (
        <div className="page-body pb-20">
            <div className="flex justify-end w-full mb-6">
                <button onClick={() => navigate("/travellers")} className="btn btn-secondary">
                    <span className="material-symbols-outlined ms">arrow_back</span>
                    Back to List
                </button>
            </div>

            <div className="max-w-4xl mx-auto px-4 mt-10">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="bg-white rounded-lg shadow-xl border border-slate-100 overflow-hidden">

                        {/* Header */}
                        <div className="bg-indigo-50 px-8 py-3 border-b border-indigo-100 flex items-center gap-4">
                            <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600 border border-indigo-100">
                                <FaUserEdit size={20} />
                            </div>
                            <div>
                                <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                                    Edit Traveller Details
                                </h2>
                            </div>
                        </div>

                        <div className="overflow-y-auto h-[70vh] p-8 space-y-8">
                            {/* Profile Photo Preview */}
                            <div className="flex items-center justify-center gap-4">
                                <img
                                    src={displayPhoto}
                                    className="h-28 w-28 rounded-full object-cover border-4 border-indigo-100 shadow-md"
                                    alt="Profile"
                                />
                            </div>

                            {/* 1. Basic Information */}
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <FaIdCard className="text-amber-400" />
                                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                                        Traveller Information
                                    </h3>
                                </div>
                                <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-100">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="col-span-2">
                                            <InputField
                                                label="Traveller UID"
                                                name="traveller_uid"
                                                register={register}
                                                errors={errors}
                                                disabled
                                            />
                                        </div>
                                        <InputField
                                            label="Beacon ID"
                                            name="beacon_id"
                                            register={register}
                                            errors={errors}

                                        />

                                        <InputField
                                            label="First Name"
                                            name="first_name"
                                            register={register}
                                            errors={errors}
                                            required
                                        />
                                        <InputField
                                            label="Last Name"
                                            name="last_name"
                                            register={register}
                                            errors={errors}
                                            required
                                        />

                                        <SelectInputField
                                            label="Gender"
                                            name="gender"
                                            register={register}
                                            errors={errors}
                                            options={genders.map(data => ({ label: data.value, value: data.value }))}
                                            required
                                        />

                                        <InputField
                                            label="Date of Birth"
                                            name="date_of_birth"
                                            type="date"
                                            register={register}
                                            errors={errors}
                                            required
                                        />

                                        <SelectInputField
                                            label="Relationship"
                                            name="relationship"
                                            register={register}
                                            errors={errors}
                                            options={relationships.map(data => ({ label: data.value, value: data.value }))}
                                            required
                                        />

                                        <SelectInputField
                                            label="Blood Group"
                                            name="blood_group"
                                            register={register}
                                            errors={errors}
                                            options={bloodGroups.map(data => ({ label: data.value, value: data.value }))}
                                        />

                                        <InputField
                                            label="Aadhaar Number"
                                            name="aadhaar_number"
                                            register={register}
                                            errors={errors}

                                        />

                                        <SelectInputField
                                            label="Status"
                                            name="status"
                                            register={register}
                                            errors={errors}
                                            options={statuses.map(data => ({ label: data.value, value: data.value }))}
                                        />

                                        <InputField
                                            label="Remarks"
                                            name="remarks"
                                            register={register}
                                            errors={errors}

                                        />

                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-slate-50 px-8 py-3 border-t border-slate-200 flex flex-col-reverse md:flex-row items-center gap-4">

                            <SaveButton
                                type="submit"
                                label="save"
                                isSaving={isSubmitting}
                                onClick={handleSubmit(onSubmit)}
                            />
                        </div>

                    </div>
                </form>
            </div>
        </div>
    );
};

export default TravellerEditPage;
