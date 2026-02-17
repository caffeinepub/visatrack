import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface VisaRecord {
    id: string;
    visaLabel: string;
    expiryDate: Time;
    createdAt: Time;
    updatedAt: Time;
    conditions?: string;
    reminders: Array<Time>;
    grantReference?: string;
}
export type Time = bigint;
export interface PDFData {
    contentType: string;
    filename: string;
    bytes: Uint8Array;
}
export interface ApplicationStatus {
    status: string;
    applicantName: string;
    applicationId: string;
    lastUpdated: Time;
    visaType: string;
    comments?: string;
    applicantEmail: string;
    attachment?: PDFData;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createOrUpdateApplicationStatus(status: ApplicationStatus): Promise<void>;
    createVisaRecord(record: VisaRecord): Promise<void>;
    deleteApplicationStatus(applicationId: string, applicantEmail: string): Promise<void>;
    deleteVisaRecord(id: string): Promise<void>;
    getAllApplicationStatuses(): Promise<Array<ApplicationStatus>>;
    getApplicationStatus(applicationId: string, applicantEmail: string): Promise<ApplicationStatus | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserProfileByPrincipal(principalId: Principal): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getUpcomingReminders(): Promise<Array<VisaRecord>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getVisaRecords(): Promise<Array<VisaRecord>>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateVisaRecord(id: string, updatedRecord: VisaRecord): Promise<void>;
}
