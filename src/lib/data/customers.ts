/**
 * FRAUDNEXUS AI — SYNTHETIC DEMO DATA
 * ⚠️ SYNTHETIC DEMO DATA — NOT REAL FINANCIAL DATA.
 * All names, accounts, devices and beneficiaries are fictional and generated for demo purposes.
 */

export type RiskProfileLevel = "low" | "medium" | "high";

export interface KnownDevice {
  id: string;
  label: string;
  addedOn: string;
}

export interface CustomerSeed {
  customerId: string;
  name: string;
  accountId: string;
  accountType: "Savings" | "Current" | "Salary";
  city: string;
  homeLocation: string;
  normalLocations: string[];
  normalAmountMin: number; // INR
  normalAmountMax: number; // INR
  normalTimeWindow: [number, number]; // hours 0-23, local
  knownDevices: KnownDevice[];
  commonBeneficiaries: string[];
  previousAlerts: { date: string; type: string; severity: "low" | "medium" | "high" }[];
  openAlerts: number;
  riskProfile: RiskProfileLevel;
  riskProfileNote: string;
}

const C = (
  customerId: string,
  name: string,
  accountId: string,
  accountType: CustomerSeed["accountType"],
  city: string,
  homeLocation: string,
  normalLocations: string[],
  normalAmountMin: number,
  normalAmountMax: number,
  normalTimeWindow: [number, number],
  knownDevices: [string, string][],
  commonBeneficiaries: string[],
  previousAlerts: CustomerSeed["previousAlerts"],
  openAlerts: number,
  riskProfile: RiskProfileLevel,
  riskProfileNote: string
): CustomerSeed => ({
  customerId,
  name,
  accountId,
  accountType,
  city,
  homeLocation,
  normalLocations,
  normalAmountMin,
  normalAmountMax,
  normalTimeWindow,
  knownDevices: knownDevices.map(([id, label], i) => ({
    id,
    label,
    addedOn: `2025-${String(((i * 3) % 11) + 1).padStart(2, "0")}-1${i}T10:20:00`,
  })),
  commonBeneficiaries,
  previousAlerts,
  openAlerts,
  riskProfile,
  riskProfileNote,
});

/** 30 synthetic customers. The first five are wired into the demo storyline. */
export const CUSTOMERS: CustomerSeed[] = [
  C("CUST-1001", "Rahul Sharma", "ACC-2041", "Salary", "Nagpur", "Nagpur, MH",
    ["Nagpur, MH"], 3000, 10000, [8, 21],
    [["DEV-A1", "Device A (Redmi Note 12)"], ["DEV-A2", "Personal Laptop"]], 
    ["Sunita Sharma", "Aman Verma", "Nagpur Utilities"],
    [{ date: "2025-06-14", type: "Amount deviation (minor)", severity: "low" }], 0, "low",
    "Long-tenure customer with stable daytime spending habits."),
  C("CUST-1002", "Priya Nair", "ACC-2042", "Savings", "Kochi", "Kochi, KL",
    ["Kochi, KL", "Thrissur, KL"], 1500, 8000, [9, 20],
    [["DEV-B1", "Device A (iPhone 13)"]], ["Meera Nair", "Kochi Water Auth"],
    [], 0, "low", "Consistent retail spending pattern, no prior alerts."),
  C("CUST-1003", "Arjun Mehta", "ACC-2043", "Current", "Pune", "Pune, MH",
    ["Pune, MH", "Mumbai, MH"], 5000, 45000, [10, 19],
    [["DEV-C1", "Business Laptop"], ["DEV-C2", "Samsung S22"]], 
    ["Mehta Trading Co", "Vikram Joshi", "GST Portal"],
    [{ date: "2025-08-02", type: "New beneficiary + high value", severity: "medium" }], 1, "medium",
    "Business account with legitimately higher value range."),
  C("CUST-1004", "Sneha Iyer", "ACC-2044", "Savings", "Chennai", "Chennai, TN",
    ["Chennai, TN"], 1000, 6000, [8, 20],
    [["DEV-D1", "Device A (Oppo Reno)"]], ["Lakshmi Iyer", "TANGEDCO Bill"],
    [], 0, "low", "Low-value habitual spender, strong routine."),
  C("CUST-1005", "Vikram Rathore", "ACC-2045", "Savings", "Jaipur", "Jaipur, RJ",
    ["Jaipur, RJ"], 2500, 9000, [7, 20],
    [["DEV-E1", "Device A (Realme 11)"]], ["Anita Rathore", "Jaipur Mart"],
    [{ date: "2025-04-19", type: "Login from new city", severity: "medium" }], 0, "medium",
    "One prior geo alert; otherwise routine behaviour."),
  C("CUST-1006", "Ananya Das", "ACC-2046", "Salary", "Kolkata", "Kolkata, WB",
    ["Kolkata, WB"], 2000, 9500, [8, 21], [["DEV-F1", "Device A (Vivo V29)"]],
    ["Rohit Das", "CESC Bill"], [], 0, "low", "Stable salary account usage."),
  C("CUST-1007", "Kabir Khan", "ACC-2047", "Current", "Hyderabad", "Hyderabad, TS",
    ["Hyderabad, TS"], 8000, 60000, [9, 20], [["DEV-G1", "Business Phone"], ["DEV-G2", "iPad"]],
    ["Khan Exports", "Faisal Khan", "Customs Duty"], [], 0, "low", "Trade account, high but regular value."),
  C("CUST-1008", "Meera Pillai", "ACC-2048", "Savings", "Bengaluru", "Bengaluru, KA",
    ["Bengaluru, KA"], 1500, 7500, [8, 22], [["DEV-H1", "Device A (Pixel 7)"]],
    ["Arun Pillai", "BESCOM"], [{ date: "2025-09-11", type: "Unusual hour activity", severity: "low" }], 0, "low",
    "Minor late-night activity flagged once; low risk."),
  C("CUST-1009", "Rohan Gupta", "ACC-2049", "Salary", "Delhi", "New Delhi, DL",
    ["New Delhi, DL", "Noida, UP"], 3000, 12000, [8, 21], [["DEV-I1", "Device A (OnePlus 11)"]],
    ["Sneha Gupta", "Delhi Jal Board"], [], 0, "low", "Regular commuter-zone usage."),
  C("CUST-1010", "Ishita Bose", "ACC-2050", "Savings", "Guwahati", "Guwahati, AS",
    ["Guwahati, AS"], 1000, 5000, [9, 19], [["DEV-J1", "Device A (Galaxy A54)"]],
    ["Mitali Bose", "APDCL Bill"], [], 0, "low", "Low-risk, low-velocity customer."),
  C("CUST-1011", "Farhan Ali", "ACC-2051", "Savings", "Lucknow", "Lucknow, UP",
    ["Lucknow, UP"], 2000, 8500, [8, 21], [["DEV-K1", "Device A (Narzo 60)"]],
    ["Zoya Ali", "LDA Dues"], [], 0, "low", "Predictable monthly-cycle spending."),
  C("CUST-1012", "Divya Reddy", "ACC-2052", "Salary", "Hyderabad", "Hyderabad, TS",
    ["Hyderabad, TS", "Secunderabad, TS"], 2500, 11000, [7, 22], [["DEV-L1", "Device A (iQOO Neo)"]],
    ["Harsha Reddy", "Rent - Green Meadows"], [], 0, "low", "Salary + rent pattern, very stable."),
  C("CUST-1013", "Nikhil Joshi", "ACC-2053", "Current", "Surat", "Surat, GJ",
    ["Surat, GJ"], 10000, 80000, [10, 19], [["DEV-M1", "Business Laptop"], ["DEV-M2", "Mi 13 Pro"]],
    ["Joshi Textiles", "Hiren Patel", "GST Portal"],
    [{ date: "2025-03-27", type: "High-value transfer review", severity: "medium" }], 0, "medium",
    "Textile merchant with prior high-value review."),
  C("CUST-1014", "Lakshmi Rao", "ACC-2054", "Savings", "Vizag", "Vizag, AP",
    ["Vizag, AP"], 1000, 7000, [8, 20], [["DEV-N1", "Device A (Galaxy M34)"]],
    ["Prasada Rao", "APEndPoint Bill"], [], 0, "low", "Senior customer, minimal digital velocity."),
  C("CUST-1015", "Aditya Verma", "ACC-2055", "Salary", "Indore", "Indore, MP",
    ["Indore, MP"], 3000, 12500, [8, 21], [["DEV-O1", "Device A (Poco X6)"]],
    ["Nisha Verma", "Indore Mart"], [{ date: "2025-07-08", type: "Amount spike", severity: "low" }], 0, "low",
    "One-time spike alert; behaviour otherwise normal."),
  C("CUST-1016", "Tanvi Deshmukh", "ACC-2056", "Savings", "Nashik", "Nashik, MH",
    ["Nashik, MH"], 1200, 6500, [8, 20], [["DEV-P1", "Device A (Infinix Hot)"]],
    ["Ajit Deshmukh", "MSEB Bill"], [], 0, "low", "Homemaker account, bill-cycle usage."),
  C("CUST-1017", "Yash Patel", "ACC-2057", "Current", "Ahmedabad", "Ahmedabad, GJ",
    ["Ahmedabad, GJ"], 6000, 55000, [9, 20], [["DEV-Q1", "Business Phone"], ["DEV-Q2", "ThinkPad"]],
    ["Patel Pharma", "Kiran Shah", "Drug License Fee"], [], 0, "low", "Pharma distributor account."),
  C("CUST-1018", "Neha Kulkarni", "ACC-2058", "Salary", "Pune", "Pune, MH",
    ["Pune, MH"], 2000, 9000, [8, 22], [["DEV-R1", "Device A (iPhone 12)"]],
    ["Amit Kulkarni", "Society Maintenance"], [], 0, "low", "Steady IT professional profile."),
  C("CUST-1019", "Gaurav Malhotra", "ACC-2059", "Savings", "Chandigarh", "Chandigarh, CH",
    ["Chandigarh, CH", "Mohali, PB"], 2500, 10000, [8, 21], [["DEV-S1", "Device A (Nothing Phone 2)"]],
    ["Ritika Malhotra", "Club Dues"], [{ date: "2025-10-02", type: "New device login", severity: "medium" }], 1, "medium",
    "Recent new-device alert under observation."),
  C("CUST-1020", "Sara Thomas", "ACC-2060", "Savings", "Kottayam", "Kottayam, KL",
    ["Kottayam, KL"], 1000, 5500, [8, 20], [["DEV-T1", "Device A (Galaxy F54)"]],
    ["John Thomas", "KSEB Bill"], [], 0, "low", "Quiet account, rural-city usage."),
  C("CUST-1021", "Adarsh Sinha", "ACC-2061", "Salary", "Patna", "Patna, BR",
    ["Patna, BR"], 2000, 8000, [8, 21], [["DEV-U1", "Device A (Redmi 13C)"]],
    ["Kavita Sinha", "BSPHCL Bill"], [], 0, "low", "Government salary account."),
  C("CUST-1022", "Pooja Chauhan", "ACC-2062", "Savings", "Bhopal", "Bhopal, MP",
    ["Bhopal, MP"], 1500, 7500, [8, 20], [["DEV-V1", "Device A (Lava Blaze)"]],
    ["Rakesh Chauhan", "BMC Dues"], [], 0, "low", "Routine household spending."),
  C("CUST-1023", "Devansh Kapoor", "ACC-2063", "Current", "Gurugram", "Gurugram, HR",
    ["Gurugram, HR", "Delhi, DL"], 15000, 120000, [9, 21], [["DEV-W1", "Work Laptop"], ["DEV-W2", "iPhone 15"]],
    ["Kapoor Consulting", "Ritika Kapoor", "Office Rent - Vatika"],
    [{ date: "2025-05-21", type: "Beneficiary velocity", severity: "medium" }], 0, "medium",
    "Consultant with many-payee month-end cycles."),
  C("CUST-1024", "Shreya Banerjee", "ACC-2064", "Savings", "Howrah", "Howrah, WB",
    ["Howrah, WB"], 1000, 6000, [8, 21], [["DEV-X1", "Device A (Realme Narzo 50)"]],
    ["Souvik Banerjee", "WBSEDCL"], [], 0, "low", "Low-value, high-regularity profile."),
  C("CUST-1025", "Imran Sheikh", "ACC-2065", "Salary", "Mumbai", "Mumbai, MH",
    ["Mumbai, MH"], 4000, 15000, [8, 22], [["DEV-Y1", "Device A (Samsung S21)"]],
    ["Ayesha Sheikh", "Society Rent"], [], 0, "low", "Mumbai-based salary account."),
  C("CUST-1026", "Kritika Sood", "ACC-2066", "Savings", "Shimla", "Shimla, HP",
    ["Shimla, HP"], 1000, 5000, [8, 19], [["DEV-Z1", "Device A (Moto G84)"]],
    ["Varun Sood", "HPSEB Bill"], [], 0, "low", "Hill-city customer, minimal velocity."),
  C("CUST-1027", "Manav Bhatt", "ACC-2067", "Current", "Vadodara", "Vadodara, GJ",
    ["Vadodara, GJ"], 5000, 40000, [9, 20], [["DEV-AA1", "Business Mobile"], ["DEV-AA2", "Dell Laptop"]],
    ["Bhatt Polymers", "Jignesh Bhatt", "Excise Duty"], [], 0, "low", "Polymer trader account."),
  C("CUST-1028", "Riya Chopra", "ACC-2068", "Savings", "Dehradun", "Dehradun, UK",
    ["Dehradun, UK"], 1200, 6000, [8, 20], [["DEV-AB1", "Device A (Galaxy A34)"]],
    ["Sahil Chopra", "Jal Sansthan"], [], 0, "low", "Regular salaried household."),
  C("CUST-1029", "Karthik Subramanian", "ACC-2069", "Salary", "Coimbatore", "Coimbatore, TN",
    ["Coimbatore, TN"], 2500, 11000, [8, 21], [["DEV-AC1", "Device A (Poco F5)"]],
    ["Deepa Subramanian", "TNPCB Fee"], [], 0, "low", "Stable engineering professional."),
  C("CUST-1030", "Zoya Mirza", "ACC-2070", "Savings", "Srinagar", "Srinagar, JK",
    ["Srinagar, JK"], 1000, 6500, [9, 19], [["DEV-AD1", "Device A (Redmi A3)"]],
    ["Aamir Mirza", "KVDDL Bill"], [], 0, "low", "Low-velocity, low-value profile."),
];

export const getCustomer = (customerId: string): CustomerSeed | undefined =>
  CUSTOMERS.find((c) => c.customerId === customerId);

export const getCustomerByAccountId = (accountId: string): CustomerSeed | undefined =>
  CUSTOMERS.find((c) => c.accountId === accountId);

export const getCustomerByName = (name: string): CustomerSeed | undefined =>
  CUSTOMERS.find((c) => c.name.toLowerCase() === name.toLowerCase());

export const DEMO_CUSTOMER_ID = "CUST-1001";
