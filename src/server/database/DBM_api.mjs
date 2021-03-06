import{DBM_initDB} from "./DBM.mjs";
import {
    DBM_setUserData,
    DBM_getUserData,
    DBM_getUserInfo,
    DBM_getUserRules,
    DBM_getUserEmpId
} from "./DBM_user.mjs"
import {
    DBM_getCurrentPunches,
    DBM_createTimesheetEntry,
    DBM_checkEmployeeRecord,
    DBM_getEmployeeList,
    DBM_getEmployeeData,
    DBM_updateEmployeeData,
    DBM_createEmployeeData
} from "./DBM_emp.mjs";

function setUserPassword(_userName, _password) {
    DBM_setUserData(_userName, "USER_PASSWORD", _password);

}



async function checkUserName(_userName, _password, _sessionID) {
    let res = await DBM_getUserData(_userName, "USER_PASSWORD");
    if (_sessionID !== 0) {
        const valid = await checkSessionID(_userName, _sessionID);
        if(valid === 1){
            _password = res;
        }
    }

    if(res === null){
        console.log("USER HAS NO PASSWORD");
        return("NO_PASS")
    }
    else if(res === "DNE"){
        console.log("User name or password is incorrect");
        return false;
    }else {
        // console.log(res);
    }

    if(_password === res){
        console.log("Passwords Match!");
        return true;
    } else{
        console.log("User name or password is incorrect");
        return false;
    }
}

async function updateTimesheet(_punchTime, _punchType, _empId){
    let res = await DBM_checkEmployeeRecord(_empId);
    if(await res !== "VALID") {
        return {status: await res};
    }
    const prevPunches = await DBM_getCurrentPunches(_empId);
    if(!prevPunches){ //If the employee has not clocked in yet today
        if(_punchType !== "shiftStart"){
            return {status: "Violation: Employee is not clocked in"};
        }

        DBM_createTimesheetEntry(_punchTime, _punchType, _empId);
    } else {
        if(prevPunches.status === "shiftEnd"){
            return {status: "Violation: Employee has clocked out"};
        } else if(prevPunches.status === "shiftStart" && (_punchType === "shiftEnd" || _punchType === "lunchStart")){
            DBM_createTimesheetEntry(_punchTime, _punchType, _empId);
        } else if(prevPunches.status === "lunchEnd" && _punchType === "shiftEnd"){
            DBM_createTimesheetEntry(_punchTime, _punchType, _empId);
        } else if(prevPunches.status === "lunchStart" && _punchType === "lunchEnd"){
            DBM_createTimesheetEntry(_punchTime, _punchType, _empId);
        } else {
            return {status: "Violation: Invalid Punch"};
        }

    }
    let curPunches = await DBM_getCurrentPunches(_empId);
    curPunches.status = "VALID";

    return curPunches;

}

async function checkSessionID(_userName, _sessionID){
    const sessionID = await DBM_getUserData(_userName, "USER_SESSION_ID");//sessionID is object containing: username, expires, and sessionID
    // console.log(sessionID);
    // console.log(sessionID.expires);
    // console.log(Date.now());
    // console.log(sessionID.sessionID);
    // console.log(_sessionID);
    if(sessionID === undefined){
        console.log("could not obtain sessionID");
        return -2;
    }
    else if(sessionID.expires < Date.now()){
        console.log("sessionID expired");
        return -1;//log out the user & prevent further call until user has a valid sessionID
    }
    else if(sessionID.sessionID == _sessionID){
        console.log("sessionID valid");
        return 1;
    }else{
        console.log("sessionID is not valid");
        return 0;//log out the user & prevent further call until user has a valid sessionID
    }
}


async function getEmployeeInfo(_type, _empId){
    let res;
    if(_type === "list"){
        res = await DBM_getEmployeeList();
        if(res === "DNE"){
            return "No Employees Exist";
        }
        else {
            return res;
        }
    }
    if(_type === "single"){
        res = await DBM_getEmployeeData(_empId);
        console.log(res);
        if(res === "DNE"){
            return "Employee does not Exist";
        }
        else {
            return res;
        }
    }

}

async function updateEmployeeInfo(_empId, _newData){
    if(_empId === "new"){
        DBM_createEmployeeData(_newData);
        return;
    }
    DBM_updateEmployeeData(_empId, _newData);



}


export {
    DBM_initDB as DBM_initDB,
    checkUserName as db_checkUserName,
    checkSessionID as db_checkSessionID,
    DBM_getUserRules as db_getUserRules,
    DBM_getUserInfo as db_getUserInfo,
    DBM_getCurrentPunches as db_getCurrentPunches,
    DBM_getUserEmpId as db_getUserEmpId,
    getEmployeeInfo as db_getEmployeeInfo,
    updateEmployeeInfo as db_updateEmployeeInfo,
    updateTimesheet as db_updateTimesheet

}

