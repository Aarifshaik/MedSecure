// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PatientDataSharing {
    address public doctor;
    address public researcher;

    enum DataType {
        PERSONAL_INFO,    // Name, address, phone, etc. (Doctor only)
        DIAGNOSIS,        // Medical diagnosis (Doctor + Researcher)
        TREATMENT,        // Treatment records (Doctor only)
        LAB_RESULTS,      // Lab results (Doctor + Researcher)
        GENERAL_MEDICAL   // General medical data (Doctor + Researcher)
    }

    struct MedicalRecord {
        string cid;
        DataType dataType;
        string description;
        uint256 timestamp;
        bool isDiagnosisData; // Quick flag for researcher access
    }

    struct PatientInfo {
        string name;
        uint256 age;
        string phoneNumber;
        string emergencyContact;
        bool isRegistered;
    }

    struct PatientData {
        MedicalRecord[] records;
        mapping(address => bool) accessGrants;
    }

    mapping(address => PatientInfo) public patientInfo;
    mapping(address => PatientData) patients;
    address[] public registeredPatients;

    event PatientRegistered(address indexed patient, string name, uint256 age);
    event DataAdded(address indexed patient, string cid, DataType dataType, string description);
    event AccessGranted(address indexed patient, address indexed grantedTo);
    event AccessRevoked(address indexed patient, address indexed revokedFrom);

    constructor(address _doctor, address _researcher) {
        doctor = _doctor;
        researcher = _researcher;
    }

    modifier onlyDoctor() {
        require(msg.sender == doctor, "Only doctor can perform this action");
        _;
    }

    modifier onlyPatient() {
        require(patientInfo[msg.sender].isRegistered, "Only registered patients");
        _;
    }

    function registerPatient(
        address _patient,
        string memory _name,
        uint256 _age,
        string memory _phoneNumber,
        string memory _emergencyContact
    ) external onlyDoctor {
        require(!patientInfo[_patient].isRegistered, "Patient already registered");
        
        patientInfo[_patient] = PatientInfo({
            name: _name,
            age: _age,
            phoneNumber: _phoneNumber,
            emergencyContact: _emergencyContact,
            isRegistered: true
        });
        
        registeredPatients.push(_patient);
        emit PatientRegistered(_patient, _name, _age);
    }

    function addData(
        string memory _cid,
        DataType _dataType,
        string memory _description
    ) external onlyPatient {
        bool isDiagnosis = (_dataType == DataType.DIAGNOSIS || 
                           _dataType == DataType.LAB_RESULTS || 
                           _dataType == DataType.GENERAL_MEDICAL);
        
        patients[msg.sender].records.push(MedicalRecord({
            cid: _cid,
            dataType: _dataType,
            description: _description,
            timestamp: block.timestamp,
            isDiagnosisData: isDiagnosis
        }));
        
        emit DataAdded(msg.sender, _cid, _dataType, _description);
    }

    function grantAccess(address _to) external onlyPatient {
        patients[msg.sender].accessGrants[_to] = true;
        emit AccessGranted(msg.sender, _to);
    }

    function revokeAccess(address _to) external onlyPatient {
        patients[msg.sender].accessGrants[_to] = false;
        emit AccessRevoked(msg.sender, _to);
    }

    function getDataCount(address _patient) external view returns (uint256) {
        return patients[_patient].records.length;
    }

    function getRecordByIndex(address _patient, uint256 _index) external view returns (
        string memory cid,
        DataType dataType,
        string memory description,
        uint256 timestamp,
        bool isDiagnosisData
    ) {
        require(_index < patients[_patient].records.length, "Index out of bounds");
        
        MedicalRecord memory record = patients[_patient].records[_index];
        
        // Access control logic
        if (msg.sender == _patient) {
            // Patient can access all their own data
            return (record.cid, record.dataType, record.description, record.timestamp, record.isDiagnosisData);
        } else if (msg.sender == doctor) {
            // Doctor can access all data if granted access
            require(patients[_patient].accessGrants[msg.sender], "Access not granted by patient");
            return (record.cid, record.dataType, record.description, record.timestamp, record.isDiagnosisData);
        } else if (msg.sender == researcher) {
            // Researcher can only access diagnosis data if granted access
            require(patients[_patient].accessGrants[msg.sender], "Access not granted by patient");
            require(record.isDiagnosisData, "Researchers can only access diagnosis data");
            return (record.cid, record.dataType, record.description, record.timestamp, record.isDiagnosisData);
        } else {
            revert("Access denied");
        }
    }

    function getPatientInfo(address _patient) external view returns (
        string memory name,
        uint256 age,
        string memory phoneNumber,
        string memory emergencyContact
    ) {
        require(patientInfo[_patient].isRegistered, "Patient not registered");
        
        if (msg.sender == _patient || msg.sender == doctor) {
            // Patient and doctor can see full info
            PatientInfo memory info = patientInfo[_patient];
            return (info.name, info.age, info.phoneNumber, info.emergencyContact);
        } else if (msg.sender == researcher) {
            // Researcher can only see name and age
            PatientInfo memory info = patientInfo[_patient];
            return (info.name, info.age, "", "");
        } else {
            revert("Access denied");
        }
    }

    function isAccessGranted(address _patient, address _accessor) external view returns (bool) {
        return patients[_patient].accessGrants[_accessor] || 
               _accessor == doctor || 
               _accessor == researcher;
    }

    function getRegisteredPatients() external view returns (address[] memory) {
        return registeredPatients;
    }

    function isPatientRegistered(address _patient) external view returns (bool) {
        return patientInfo[_patient].isRegistered;
    }

    function getDiagnosisDataCount(address _patient) external view returns (uint256) {
        require(msg.sender == researcher || msg.sender == doctor || msg.sender == _patient, "Access denied");
        
        uint256 count = 0;
        for (uint256 i = 0; i < patients[_patient].records.length; i++) {
            if (patients[_patient].records[i].isDiagnosisData) {
                count++;
            }
        }
        return count;
    }
}