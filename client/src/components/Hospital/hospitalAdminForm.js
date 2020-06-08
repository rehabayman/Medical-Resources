import React, {useState, useEffect} from 'react';
import { getAdminData, editAdminData} from '../../services/hospitalService';

export default () => {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState("show");
    const adminId = JSON.parse(localStorage.getItem("user")).id;

    useEffect(() => { 
        getAdminData(adminId).then(response => {
            if (response) {                                
                const retrievedAdminData = response.data;
                setAdminData(retrievedAdminData);
            }
            }).catch(error => {
                console.log(error); 
            });           
    }, []);

    const setAdminData = (retrievedAdminData) => {
        setFirstName(retrievedAdminData.firstName);
        setLastName(retrievedAdminData.lastName);
        setPassword("");
        setEmail(retrievedAdminData.email);
    }

    const handleFirstNameChange = (e) => {
        e.preventDefault();
        setFirstName(e.target.value);
    }
    const handleLastNameChange = (e) => {
        e.preventDefault();
        setLastName(e.target.value);
    }
    const handlePasswordChange = (e) => {
        e.preventDefault();
        setPassword(e.target.value);
    }
    const handleEmailChange = (e) => {
        e.preventDefault();
        setEmail(e.target.value);
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        const data = {
            firstName,
            lastName,
            email
        }

        editAdminData(data, adminId).then(response => {
            if (response) {
                // console.log(response);
                window.location.reload(false);
            }
        }).catch(error => {
            console.log(error.response); 
        });
    }

    return(
        <div className="pharmacy-admin-info-card">
            <div className="x-card-header">
                <h4>Admin Info</h4>
                { status === "show"? 
                    <button type="submit" onClick={()=>{setStatus("edit")}} className="x-btn"> Edit </button> 
                    :
                    <button type="submit" onClick={handleSubmit} className="x-btn"> Save </button>
                }
               {/**  <button type="submit" onClick={handleSubmit} className="x-btn"> Edit </button>*/}
            </div>
            <div className="admin-name-container">
                <div>
                    <input 
                        type="text"
                        className="form-input"
                        name="firstName"
                        value={firstName}
                        onChange={handleFirstNameChange}
                        placeholder="First Name"
                        disabled = {status === "show"? true : false} 
                    />
                </div>
                <div>
                    <input 
                        type="text"
                        className="form-input"
                        name="lastName"
                        value={lastName}
                        onChange={handleLastNameChange}
                        placeholder="Last Name"
                        disabled = {status === "show"? true : false}
                    />
                </div>
            </div>
            <div>
                <input 
                    type="email"
                    className="form-input"
                    name="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="Email"
                    disabled = {status === "show"? true : false}
                />
            </div>
            <div>
                <input 
                    type="password"
                    className="form-input"
                    name="password"
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="New Password"
                    disabled = {status === "show"? true : false}
                />
            </div>
        </div>
    )
}