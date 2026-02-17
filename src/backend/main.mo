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
        attachment = null;
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
