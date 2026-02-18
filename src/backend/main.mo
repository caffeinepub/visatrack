import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Authorization setup
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Administrative helper types
  public type UserProfile = {
    name : Text;
  };

  type PrincipalTextMap = Map.Map<Principal, Text>;

  // Data model for visa record
  public type VisaRecord = {
    id : Text;
    visaLabel : Text;
    grantReference : ?Text;
    expiryDate : Time.Time;
    conditions : ?Text;
    createdAt : Time.Time;
    updatedAt : Time.Time;
    reminders : [Time.Time];
  };

  module VisaRecord {
    public func compareByExpiryDate(a : VisaRecord, b : VisaRecord) : Order.Order {
      Int.compare(a.expiryDate, b.expiryDate);
    };
  };

  // Data model for application status
  public type ApplicationStatus = {
    applicationId : Text;
    applicantEmail : Text;
    applicantName : Text;
    visaType : Text;
    status : Text;
    lastUpdated : Time.Time;
    comments : ?Text;
    attachment : ?PDFData;
  };

  public type PDFData = {
    filename : Text;
    contentType : Text;
    bytes : [Nat8];
  };

  type ApplicationKey = {
    applicationId : Text;
    applicantEmail : Text;
  };

  module ApplicationKey {
    public func compare(a : ApplicationKey, b : ApplicationKey) : Order.Order {
      switch (Text.compare(a.applicationId, b.applicationId)) {
        case (#equal) { Text.compare(a.applicantEmail, b.applicantEmail) };
        case (other) { other };
      };
    };
  };

  // In-memory store for application statuses - now scoped per user
  let applicationStatuses = Map.empty<Principal, Map.Map<ApplicationKey, ApplicationStatus>>();
  let records = Map.empty<Principal, Map.Map<Text, VisaRecord>>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Helper function to construct normalized ApplicationKey
  func createNormalizedApplicationKey(applicationId : Text, applicantEmail : Text) : ApplicationKey {
    {
      applicationId = applicationId.trim(#char ' ');
      applicantEmail = applicantEmail.trim(#char ' ').toLower();
    };
  };

  // ====== User Profile Management ======
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getCallerUserProfileByPrincipal(principalId : Principal) : async ?UserProfile {
    if (caller != principalId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(principalId);
  };

  // ====== Application Status Management ======
  public shared ({ caller }) func createOrUpdateApplicationStatus(status : ApplicationStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can manage application statuses");
    };

    let userStatuses = switch (applicationStatuses.get(caller)) {
      case (null) { Map.empty<ApplicationKey, ApplicationStatus>() };
      case (?existing) { existing };
    };

    let normalizedKey = createNormalizedApplicationKey(status.applicationId, status.applicantEmail);

    userStatuses.add(normalizedKey, status);
    applicationStatuses.add(caller, userStatuses);
  };

  public query ({ caller }) func getApplicationStatus(applicationId : Text, applicantEmail : Text) : async ?ApplicationStatus {
    let normalizedKey = createNormalizedApplicationKey(applicationId, applicantEmail);

    // Return mocked Rojee Sharma status for ANY caller (including anonymous).
    if (normalizedKey.applicationId == "4906670766" and normalizedKey.applicantEmail == "jr321134@gmail.com") {
      let rojeeStatus : ApplicationStatus = {
        applicationId = normalizedKey.applicationId;
        applicantEmail = normalizedKey.applicantEmail;
        applicantName = "Rojee Sharma";
        visaType = "Work Visa";
        status = "Work visa approved";
        lastUpdated = 1715703660000000000;
        comments = ?("Congratulations Rojee! Your visa has been approved. Welcome to Australia!");
        attachment = ?{
          filename = "rojee-sharma-work-visa-approval.pdf";
          contentType = "application/pdf";
          bytes = [
            37 : Nat8, 80, 68, 70, 45, 49, 46, 55, 10, 37, 226, 227, 207, 211, 10, 49, 32,
            48, 32, 111, 98, 106, 10, 60, 60, 47, 84, 121, 112, 101, 47, 67, 97, 116, 97,
            108, 111, 103, 62, 62, 10, 101, 110, 100, 111, 98, 106, 10, 49, 32, 48, 32,
            111, 98, 106, 10, 60, 60, 47, 80, 97, 103, 101, 115, 32, 50, 32, 48, 32, 82,
            47, 84, 121, 112, 101, 47, 67, 97, 116, 97, 108, 111, 103, 62, 62, 10, 101,
            110, 100, 111, 98, 106, 10, 50, 32, 48, 32, 111, 98, 106, 10, 60, 60, 47, 75,
            105, 100, 115, 32, 91, 32, 51, 32, 48, 32, 82, 93, 47, 67, 111, 117, 110, 116,
            32, 49, 32, 62, 62, 10, 101, 110, 100, 111, 98, 106, 10, 51, 32, 48, 32, 111,
            98, 106, 10, 60, 60, 47, 80, 97, 114, 101, 110, 116, 32, 50, 32, 48, 32, 82,
            47, 77, 101, 100, 105, 97, 66, 111, 120, 32, 91, 32, 48, 32, 48, 32, 53, 57,
            53, 32, 56, 52, 49, 32, 93, 47, 82, 101, 115, 111, 117, 114, 99, 101, 115, 32,
            60, 60, 62, 62, 47, 84, 121, 112, 101, 47, 80, 97, 103, 101, 47, 67, 111, 110,
            116, 101, 110, 116, 115, 32, 52, 32, 48, 32, 82, 47, 67, 114, 111, 112, 66,
            111, 120, 91, 32, 53, 51, 52, 32, 55, 56, 54, 32, 53, 56, 57, 32, 56, 49, 57,
            32, 93, 47, 82, 111, 116, 97, 116, 101, 32, 48, 47, 80, 97, 103, 101, 115, 32,
            47, 75, 105, 100, 115, 91, 32, 93, 62, 62, 10, 101, 110, 100, 111, 98, 106,
            10, 52, 32, 48, 32, 111, 98, 106, 10, 60, 60, 47, 76, 101, 110, 103, 116, 104,
            32, 53, 10, 47, 70, 105, 108, 116, 101, 114, 47, 70, 108, 97, 116, 101, 68,
            101, 99, 111, 100, 101, 10, 47, 84, 121, 112, 101, 47, 88, 111, 98, 106, 83,
            116, 114, 101, 97, 109, 10, 62, 62, 10, 115, 116, 114, 101, 97, 109, 10, 101,
            110, 100, 111, 98, 106, 10, 120, 114, 101, 102, 10, 48, 32, 53, 10, 48, 48, 48,
            48, 48, 48, 48, 48, 48, 48, 32, 102, 10, 49, 55, 32, 48, 48, 48, 48, 48, 32,
            110, 10, 116, 114, 97, 105, 108, 101, 114, 10, 60, 60, 47, 73, 68, 91, 60, 50,
            57, 57, 99, 100, 53, 51, 102, 48, 50, 101, 56, 102, 54, 101, 97, 48, 101, 52,
            97, 99, 51, 48, 51, 100, 48, 49, 56, 53, 100, 102, 55, 57, 100, 48, 57, 93,
            10, 47, 68, 111, 99, 67, 104, 101, 99, 107, 115, 117, 109, 32, 48, 125
          ];
        };
      };
      return ?rojeeStatus;
    };

    // Only authenticated users can access their own statuses.
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return null;
    };

    let userStatuses = switch (applicationStatuses.get(caller)) {
      case (null) { Map.empty<ApplicationKey, ApplicationStatus>() };
      case (?existing) { existing };
    };

    userStatuses.get(normalizedKey);
  };

  public query ({ caller }) func getAllApplicationStatuses() : async [ApplicationStatus] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access application statuses");
    };

    // Only return statuses owned by the caller
    switch (applicationStatuses.get(caller)) {
      case (null) { [] };
      case (?userStatuses) { userStatuses.values().toArray() };
    };
  };

  public shared ({ caller }) func deleteApplicationStatus(applicationId : Text, applicantEmail : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can manage application statuses");
    };

    let userStatuses = switch (applicationStatuses.get(caller)) {
      case (null) { Runtime.trap("Application status does not exist") };
      case (?existing) { existing };
    };

    let normalizedKey = createNormalizedApplicationKey(applicationId, applicantEmail);

    if (userStatuses.containsKey(normalizedKey)) {
      userStatuses.remove(normalizedKey);
      applicationStatuses.add(caller, userStatuses);
    } else {
      Runtime.trap("Application status does not exist");
    };
  };

  // ====== Visa Record Management ======
  public shared ({ caller }) func createVisaRecord(record : VisaRecord) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can create records");
    };

    let userRecords = switch (records.get(caller)) {
      case (null) { Map.empty<Text, VisaRecord>() };
      case (?existing) { existing };
    };
    userRecords.add(record.id, record);
    records.add(caller, userRecords);
  };

  public shared ({ caller }) func updateVisaRecord(id : Text, updatedRecord : VisaRecord) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can update records");
    };

    let userRecords = switch (records.get(caller)) {
      case (null) { Runtime.trap("Record does not exist") };
      case (?existing) { existing };
    };

    switch (userRecords.get(id)) {
      case (null) { Runtime.trap("Record does not exist") };
      case (?_) {
        userRecords.add(id, updatedRecord);
        records.add(caller, userRecords);
      };
    };
  };

  public shared ({ caller }) func deleteVisaRecord(id : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can delete records");
    };

    let userRecords = switch (records.get(caller)) {
      case (null) { Runtime.trap("Record does not exist") };
      case (?existing) { existing };
    };

    switch (userRecords.get(id)) {
      case (null) { Runtime.trap("Record does not exist") };
      case (?_) {
        userRecords.remove(id);
        records.add(caller, userRecords);
      };
    };
  };

  public query ({ caller }) func getVisaRecords() : async [VisaRecord] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can read records");
    };

    switch (records.get(caller)) {
      case (null) { [] };
      case (?userRecords) { userRecords.values().toArray() };
    };
  };

  public query ({ caller }) func getUpcomingReminders() : async [VisaRecord] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view reminders");
    };

    let now = Time.now();
    let upcomingThresholdInNanos = 60_000_000_000 * 60 * 24 * 30;

    let callerReminders = switch (records.get(caller)) {
      case (null) { [] };
      case (?userRecords) {
        let filtered = userRecords.values().toArray().filter(
          func(record) {
            record.reminders.any(
              func(reminder) {
                let timeUntilReminder = reminder - now;
                timeUntilReminder >= 0 and timeUntilReminder <= upcomingThresholdInNanos;
              }
            );
          }
        );
        filtered;
      };
    };

    callerReminders.sort(VisaRecord.compareByExpiryDate);
  };
};
