import React, {useContext, useEffect, useState} from "react";
import axios from 'axios'
import Header from "../../Header";
import '../../../styles/cart.scss'
import UserService from '../../../services/userServices'
import {getCart} from "../../../utils/cart_utils";
import {
    faArrowLeft,
    faArrowRight, faChevronLeft, faChevronRight,
    faTimes
} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {AuthContext} from "../../../providers/auth_provider";
import {removePharmacyFromCart, removeMedicineFromCart} from "../../../utils/cart_utils";
import {Link, withRouter} from "react-router-dom";
import Modal from "react-bootstrap/Modal";
import ErrorMessage from "../../other/ErrorMessage";
import {getCurrentDay, getCurrentHourInSeconds} from "../../../utils/utils";
import {AppContext} from "../../../providers/AppProvider";
import {
    createMuiTheme,
    MuiThemeProvider,
    withStyles
} from "@material-ui/core/styles";
import Tooltip from "@material-ui/core/Tooltip";
import PublicHeader from "../../PublicHeader";
import AutoCompleteAddressInput from "../../other/AutoCompleteAddressInput";

const theme = createMuiTheme({
    overrides: {
        MuiTooltip: {
            tooltip: {
                fontSize: "0.95rem",
            }
        }
    }
});
const CartPage = (props) => {

    const {user} = useContext(AuthContext);
    const {setTitle} = useContext(AppContext);
    const [userProfile, setUserProfile] = useState({})
    const [cartDetails, setCartDetails] = useState([])
    const [currentMedicines, setCurrentMedicines] = useState([])
    const [currentPharmacyIndex, setCurrentPharmacyIndex] = useState(-1)
    const [currentMedicineIndex, setCurrentMedicineIndex] = useState(-1)
    const [totalPrice, setTotalPrice] = useState(0)
    const [useCurrentInfo, setUseCurrentInfo] = useState(false)
    const [show, setShow] = useState(false);
    const [userAddress, setUserAddress] = useState('')
    const [userPosition, setUserPosition] = useState({})
    const [userPhone, setUserPhone] = useState('')
    const handleClose = () => setShow(false);
    const [errors, setErrors] = useState({})
    const [medicinesList, setMedicinesList] = useState('')
    const [showWarning, setShowWarning] = useState(false)
    const [showReservationConfirmationPopUp, setShowReservationConfirmationPopUp] = useState(false);
    const [showCompleteProfilePopup, setShowCompleteProfilePopup] = useState(false);
    const [orderCurrentModelView, setOrderCurrentModelView] = useState('enter_data')
    const [pharmacyPosition, setPharmacyPosition] = useState({})
    const [finalTotalPrice, setFinalTotalPrice] = useState(0)

    useEffect(() => {
        setTitle('Cart')
        // if (!user.id) return;
        UserService.getUserInfo(user.id).then((response) => {
            setUserProfile(response.data)
        })

        UserService.getCartDetails(getCart()).then((response) => {
            const cart = response.data
            cart.forEach((pharmacy) => {
                pharmacy.medicines = pharmacy.medicines.filter((medicine) => medicine.quantity > 0)
                if (pharmacy.medicines.length === 0) {
                    removePharmacyFromCart(pharmacy.pharmacy._id)
                }
                pharmacy.medicines = pharmacy.medicines.map((medicine) => {
                    medicine.userQuantity = 1
                    return medicine
                })
            })
            setCartDetails(cart.filter(pharmacy => pharmacy.medicines.length > 0))
            if (response.data.length > 0) {
                setCurrentPharmacyIndex(0)
            }
        })
    }, [])

    useEffect(() => {
        console.log(currentPharmacyIndex,"LLLLLLL")
        if (currentPharmacyIndex >= 0) {
            setCurrentMedicineIndex(0)
            setMedicinesList(cartDetails[currentPharmacyIndex].medicines.reduce((acc, medicine) => {
                if (acc.length > 1) {
                    acc = `${acc}, `
                }
                return `${acc} ${medicine.name}`
            }, ''))
            setOrderCurrentModelView('enter_data')
            setCurrentMedicines(cartDetails[currentPharmacyIndex].medicines)
            setPharmacyPosition(cartDetails[currentPharmacyIndex].pharmacy.pharmacyPosition)
            setTotalPrice(cartDetails[currentPharmacyIndex].medicines.reduce((acc, medicine) => {
                return acc + (medicine.price * medicine.userQuantity)
            }, 0))

            setFinalTotalPrice(cartDetails[currentPharmacyIndex].medicines.reduce((acc, medicine) => {
                return acc + (medicine.price * medicine.userQuantity)
            }, 0))
        } else {
            setCurrentMedicineIndex(-1)
        }

    }, [currentPharmacyIndex])

    useEffect(() => {
        if (cartDetails.length === 0) {
            setCurrentPharmacyIndex(-1)
            setCurrentMedicineIndex(-1)
        } else {
            console.log(cartDetails.length)
            setCurrentPharmacyIndex(0)
            setCurrentMedicineIndex(0)
            setMedicinesList(cartDetails[0].medicines.reduce((acc, medicine) => {
                if (acc.length > 1) {
                    acc = `${acc}, `
                }
                return `${acc} ${medicine.name}`
            }, ''))
            setOrderCurrentModelView('enter_data')
            setCurrentMedicines(cartDetails[0].medicines)
            setPharmacyPosition(cartDetails[0].pharmacy.pharmacyPosition)
            setTotalPrice(cartDetails[0].medicines.reduce((acc, medicine) => {
                return acc + (medicine.price * medicine.userQuantity)
            }, 0))

            setFinalTotalPrice(cartDetails[0].medicines.reduce((acc, medicine) => {
                return acc + (medicine.price * medicine.userQuantity)
            }, 0))
        }
    }, [cartDetails.length])

    useEffect(() => {
        if (currentMedicines.length === 0 && currentPharmacyIndex >= 0) {
            setCartDetails(cartDetails.filter((pharmacy) => cartDetails[currentPharmacyIndex].pharmacy._id !== pharmacy.pharmacy._id))
            removePharmacyFromCart(cartDetails[currentPharmacyIndex].pharmacy._id)
            setCurrentPharmacyIndex(0)
        } else {
            setCurrentMedicineIndex(0)
        }
    }, [currentMedicines.length])


    const isOpened = () => {
        console.log("isOpened")
        return (cartDetails[currentPharmacyIndex].pharmacy.workingHours.filter((day) => {
            return day.day === getCurrentDay() && day.startTime <= getCurrentHourInSeconds() && day.endTime > getCurrentHourInSeconds() && day.isOpened
        }).length > 0)
    }

    const handleChangeQuantity = (index) => {
        return (e) => {
            const {target: {value}} = e;
            setTotalPrice(((totalPrice - currentMedicines[index].userQuantity * currentMedicines[index].price) + (Number(value) * currentMedicines[index].price)))
            setFinalTotalPrice(((totalPrice - currentMedicines[index].userQuantity * currentMedicines[index].price) + (Number(value) * currentMedicines[index].price)))
            currentMedicines[index].userQuantity = value
            setCurrentMedicines(currentMedicines)
        }
    }

    const buildData = () => {
        const pharmacyId = cartDetails[currentPharmacyIndex].pharmacy._id
        const data = {totalPrice: finalTotalPrice, order: []}
        currentMedicines.forEach((medicine) => {
            if (medicine.quantity > 0) {
                data.order.push({medicine: medicine._id, quantity: medicine.userQuantity, price: medicine.price})
            }
        })
        return {pharmacyId, data}
    }

    const handleClickReserve = () => {
        const params = buildData()
        UserService.reserveMedicine(user.id, params.pharmacyId, params.data).then((response) => {
            setCartDetails(cartDetails.filter((pharmacy) => params.pharmacyId !== pharmacy.pharmacy._id))
            removePharmacyFromCart(params.pharmacyId)
            setShowReservationConfirmationPopUp(false);
        })
    }

    const handleClickConfirm = () => {
        const params = buildData()
        const address = (!useCurrentInfo) ? userAddress : `${userProfile.address.street}, ${userProfile.address.district}, ${userProfile.address.governorate}, Flat Number: ${userProfile.address.flatNum}`
        const phone = (!useCurrentInfo) ? userPhone : `${userProfile.phoneNumber}`
        const position = (!useCurrentInfo) ? userPosition : userProfile.userPosition
        const data = {...params.data, userAddress: address, userPhone: phone, userPosition: position}
        UserService.orderMedicine(user.id, params.pharmacyId, data).then((response) => {
            setCartDetails(cartDetails.filter((pharmacy) => params.pharmacyId !== pharmacy.pharmacy._id))
            removePharmacyFromCart(params.pharmacyId)
            setShow(false)
        }).catch((error) => {
            // console.log(error.response.data)
            if (error.response.data.errors) {
                setOrderCurrentModelView('enter_data')
                setErrors(error.response.data.errors)
            } else {
                setErrors({})
            }
        })
    }

    const handleClickCloseReservation = (pharmacyId) => {
        return () => {
            setCartDetails(cartDetails.filter((pharmacy) => pharmacyId !== pharmacy.pharmacy._id))
            removePharmacyFromCart(pharmacyId)

        }
    }

    const handleClickRemoveMedicine = (pharmacyId, medicineId) => {
        return () => {
            currentMedicines.forEach((medicine) => {
                if (medicine._id === medicineId) {
                    setTotalPrice(totalPrice - (medicine.userQuantity * medicine.price))
                    setFinalTotalPrice(totalPrice - (medicine.userQuantity * medicine.price))
                }
            })
            removeMedicineFromCart(pharmacyId, medicineId)
            setCurrentMedicines(currentMedicines.filter((medicine) => medicineId !== medicine._id))
        }
    }

    const handleShowWarning = () => {
        if (!user.accessToken) {
            props.history.push("/")
            return;
        }
        setShowWarning(true);
    }

    const handleShow = () => {
        if (!user.accessToken) {
            props.history.push("/")
            return;
        }
        setShow(true);
    }


    return (<div className="x-container-cart">
        {user.accessToken ? <Header/> : <PublicHeader/>}

        {currentPharmacyIndex < 0 ? <div className="empty-cart-container">
            <img src="../../../../img/empty-cart.png"/>
            <h2>Your cart is empty!</h2>
            <Link to="/pharmacys"><h5>Add Medicines To Cart</h5></Link>
        </div> : <div className="body-cart-container">
            <div className="x-footer">

                {(currentPharmacyIndex - 1 >= 0) && <FontAwesomeIcon onClick={() => {
                    setCurrentPharmacyIndex(currentPharmacyIndex - 1)
                }} color="#28303A" size="3x" icon={faArrowLeft}/>}
            </div>
            {(currentPharmacyIndex >= 0 && cartDetails[currentPharmacyIndex]) && <div className="pharmacy-cart-card">
                <div className="pharmacy-cart-card-header">
                    <FontAwesomeIcon icon={faTimes}
                                     onClick={handleClickCloseReservation(cartDetails[currentPharmacyIndex].pharmacy._id)}/>
                </div>
                <div>
                    <h4>{cartDetails[currentPharmacyIndex].pharmacy.name}</h4>
                </div>
                <div>
                    <p>{`${cartDetails[currentPharmacyIndex].pharmacy.location[0].street}`}</p>
                </div>
                <div className="medicines-container-cart">
                    <div className="medicines-card-cart-arrows">
                        {(currentMedicineIndex - 1 >= 0) && <FontAwesomeIcon onClick={() => {
                            setCurrentMedicineIndex(currentMedicineIndex - 1)
                        }} size="2x" icon={faChevronLeft}/>}
                    </div>
                    <div className="medicines-card-content">


                        {(currentMedicineIndex >= 0 && currentMedicines[currentMedicineIndex]) &&
                        <div className="medicines-card">
                            <div className="medicines-card-header">
                                <FontAwesomeIcon
                                    onClick={handleClickRemoveMedicine(cartDetails[currentPharmacyIndex].pharmacy._id, currentMedicines[currentMedicineIndex]._id)}
                                    size="xs" icon={faTimes}/>
                            </div>
                            <h5>{currentMedicines[currentMedicineIndex].name}</h5>
                            {currentMedicines[currentMedicineIndex].quantity === 0 ? <div>
                                <p>{`${currentMedicines[currentMedicineIndex].name} is sold out`}</p>
                                <p style={{fontSize: '0.75em'}}>{`this medicine will not be included in order`}</p>
                            </div> : <div className="quantity-container">
                                <p>Quantity : </p>
                                <input type="number" onChange={handleChangeQuantity(currentMedicineIndex)}
                                       min="1"
                                       value={currentMedicines[currentMedicineIndex].userQuantity}
                                       max={currentMedicines[currentMedicineIndex].quantity}/>
                            </div>}
                            <p>Unit Price : {currentMedicines[currentMedicineIndex].price}LE</p>
                        </div>}


                        {(currentMedicineIndex >= 0 && currentMedicineIndex + 1 < currentMedicines.length && currentMedicines[currentMedicineIndex + 1]) &&
                        <div className="medicines-card">
                            <div className="medicines-card-header">
                                <FontAwesomeIcon
                                    onClick={handleClickRemoveMedicine(cartDetails[currentPharmacyIndex].pharmacy._id, currentMedicines[currentMedicineIndex + 1]._id)}
                                    size="xs" icon={faTimes}/>
                            </div>
                            <h5>{currentMedicines[currentMedicineIndex + 1].name}</h5>
                            <div className="quantity-container">
                                <p>Quantity : </p>
                                <input type="number" onChange={handleChangeQuantity(currentMedicineIndex + 1)}
                                       min="1"
                                       value={currentMedicines[currentMedicineIndex + 1].userQuantity}
                                       max={currentMedicines[currentMedicineIndex + 1].quantity}/>
                            </div>
                            <p>Unit Price : {currentMedicines[currentMedicineIndex + 1].price}LE</p>
                        </div>}
                    </div>
                    <div className="medicines-card-cart-arrows">
                        {(currentMedicineIndex + 2 < currentMedicines.length) && <FontAwesomeIcon onClick={() => {
                            setCurrentMedicineIndex(currentMedicineIndex + 1)
                        }} size="2x" icon={faChevronRight}/>}
                    </div>

                </div>
                <div className="pharmacy-cart-card-footer">
                    <h5>Total Price : {totalPrice}LE</h5>
                    <div className="btn-container">
                        {cartDetails[currentPharmacyIndex].pharmacy.delivery &&
                        <MuiThemeProvider theme={theme}>
                            <Tooltip
                                title={`when you order medicine, you will get it at your address`}
                                placement="top"
                            >
                                <button onClick={(isOpened()) ? handleShow : handleShowWarning}>Order</button>
                            </Tooltip>
                        </MuiThemeProvider>
                        }
                        <MuiThemeProvider theme={theme}>
                            <Tooltip
                                title={`when you reserve medicine, you should go to pharmacy to take theme before specific period`}
                                placement="top"
                            >
                                <button onClick={(isOpened()) ? () => {
                                    if (!user.accessToken) {
                                        props.history.push("/")
                                        return;
                                    }
                                    setShowReservationConfirmationPopUp(true)
                                } : handleShowWarning}>Reserve
                                </button>
                            </Tooltip>
                        </MuiThemeProvider>
                    </div>
                </div>
            </div>}
            <div className="x-footer">

                {(currentPharmacyIndex + 1 < cartDetails.length) && <FontAwesomeIcon onClick={() => {
                    setCurrentPharmacyIndex(currentPharmacyIndex + 1)
                }} color="#28303A" size="3x" icon={faArrowRight}/>}
            </div>
        </div>}

        <>
            <Modal
                size="lg"
                aria-labelledby="contained-modal-title-vcenter"
                centered
                show={showCompleteProfilePopup}
                onHide={() => setShowCompleteProfilePopup(false)}
                onEnter={() => {
                    setShow(false)
                }}
                onExit={() => {
                    setShow(true)
                }}
            >
                <Modal.Header closeButton>
                    <Modal.Title id="example-modal-sizes-title-sm">
                        Warning
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {cartDetails[currentPharmacyIndex] && <p>
                        {`To use this option you should complete your profile`}
                    </p>}
                </Modal.Body>
                <Modal.Footer>
                    <div className="btn-container">
                        <button onClick={() => {
                            setShowCompleteProfilePopup(false)
                        }}>Continue
                        </button>
                        <Link to="/user/profile">Go TO Profile</Link>
                    </div>
                </Modal.Footer>
            </Modal>
        </>

        <>
            <Modal
                size="lg"
                show={showReservationConfirmationPopUp}
                onHide={() => setShowReservationConfirmationPopUp(false)}
                aria-labelledby="example-modal-sizes-title-sm">
                <Modal.Header closeButton>
                    <Modal.Title id="example-modal-sizes-title-sm">
                        Reservation Confirmation
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {cartDetails[currentPharmacyIndex] && <div>
                        <p className="mt-1">Are You Sure You Want to Reserve this medicines
                            list <b>({`${medicinesList} `})</b> with <b>total price: {totalPrice}LE</b></p>
                        <p><b>Note
                            :</b>{` you should go to  ${cartDetails[currentPharmacyIndex].pharmacy.name} within ${cartDetails[currentPharmacyIndex].pharmacy.maxTimeLimit} hours to get theme.`}
                        </p>
                    </div>}

                </Modal.Body>
                <Modal.Footer>
                    <div className="btn-container">
                        <button onClick={handleClickReserve}>Confirm</button>
                    </div>
                </Modal.Footer>
            </Modal>
        </>

        <>
            <Modal
                size="lg"
                show={showWarning}
                onHide={() => setShowWarning(false)}
                aria-labelledby="example-modal-sizes-title-sm">
                <Modal.Header closeButton>
                    <Modal.Title id="example-modal-sizes-title-sm">
                        Warning
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {cartDetails[currentPharmacyIndex] && <p><Link
                        to={{
                            pathname: `/pharmacys/${cartDetails[currentPharmacyIndex].pharmacy.name}`,
                            state: {pharmacyId: cartDetails[currentPharmacyIndex].pharmacy._id}
                        }}>{cartDetails[currentPharmacyIndex].pharmacy.name}</Link>{` is closed Now, please check pharmacy profile`}
                    </p>}
                </Modal.Body>
            </Modal>
        </>

        <>
            <Modal
                show={show}
                onHide={() => {
                    setOrderCurrentModelView('enter_data')
                    setShow(false)
                }}
                size="lg"
                aria-labelledby="example-custom-modal-styling-title"
            >
                <Modal.Header closeButton>
                    <Modal.Title id="example-custom-modal-styling-title">
                        Order Confirmation
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div>
                        {orderCurrentModelView === 'enter_data' ? <><p>Please Enter Your Address & Phone Number</p>
                                <div className="inputs-modal-container">
                                    <div>
                                        <input className="form-input" disabled={useCurrentInfo} type="text"
                                               value={userPhone}
                                               placeholder="Phone Number..." onChange={(event => {
                                            setUserPhone(event.target.value)
                                        })}/>
                                        {errors.userPhone && <ErrorMessage message={errors.userPhone}/>}
                                    </div>
                                    <div>
                                        <AutoCompleteAddressInput disabled={useCurrentInfo} value={userAddress}
                                                                  setAddress={setUserAddress} width={'32.8%'}
                                                                  setPosition={setUserPosition}/>
                                        {errors.userAddress && <ErrorMessage message={errors.userAddress}/>}
                                    </div>
                                </div>
                                <div className="use-defualt-current-account-data-constainer">
                                    <input type="checkbox" id="use-defualt-current-account-data"
                                           name="use-defualt-current-account-data" checked={useCurrentInfo}
                                           onChange={(event => {
                                               const {target: {checked}} = event;
                                               if (!userProfile.profileIsCompleted) {
                                                   setShowCompleteProfilePopup(true)
                                                   return
                                               }
                                               setUseCurrentInfo(checked)
                                           })}
                                    />
                                    <label htmlFor="use-defualt-current-account-data">Use the address and phone number you
                                        entered before ?</label>
                                </div>
                            </> :
                            <p className="mt-1">Are You Sure You Want to Order this medicines
                                list <b>({`${medicinesList} `})</b> with <b>total price: {finalTotalPrice}LE</b></p>}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <div className="btn-container">
                        {orderCurrentModelView === 'enter_data' ? <>
                            <button onClick={() => {
                                console.log(errors)
                                const errorObj = {};
                                let isErrorExist = false;
                                if (!userPosition.coordinates && !useCurrentInfo ) {
                                    isErrorExist = true
                                    errorObj.userAddress = "Invalid Address"
                                }
                                if (userAddress.trim().length === 0 && !useCurrentInfo) {
                                    isErrorExist = true
                                    errorObj.userAddress = "Address is required"
                                }
                                if (userPhone.trim().length === 0 && !useCurrentInfo) {
                                    isErrorExist = true
                                    errorObj.userPhone = "Phone is required"
                                }
                                if (isErrorExist ) {
                                    setErrors(errorObj)
                                    // errors
                                    console.log(errors)
                                    return
                                }
                                const position = (!useCurrentInfo) ? userPosition : userProfile.userPosition
                                axios({
                                    method: 'post',
                                    url: `${process.env.REACT_APP_BACKEND_URL}/locations/distance`,
                                    data: {
                                        "origins": [...cartDetails[currentPharmacyIndex].pharmacy.pharmacyPosition.coordinates],
                                        "destinations": [...position.coordinates]
                                    }
                                }).then((response) => {
                                    if (response.data.distance) {
                                        setFinalTotalPrice(totalPrice + Math.round(Number(response.data.distance * cartDetails[currentPharmacyIndex].pharmacy.deliveryCostPerKm)))
                                    }
                                })
                                setOrderCurrentModelView('summary')
                            }
                            }>Next
                            </button>
                        </> : <>
                            <button onClick={() => {

                                setOrderCurrentModelView('enter_data')
                            }}>Previous
                            </button>
                            <button onClick={handleClickConfirm}>Confirm</button>
                        </>}
                    </div>
                </Modal.Footer>
            </Modal>
        </>

    </div>)
}

export default withRouter(CartPage)
