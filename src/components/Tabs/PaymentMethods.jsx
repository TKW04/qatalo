import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from "react-redux";

import { useNotification } from "../UI/NotificationProvider";
import { InputText } from 'primereact/inputtext';

import { GetPaymentMethods, CreatePaymentMethod, DeletePaymentMethod, UpdatePaymentMethod } from "../../store/paymentMethod-store/paymentMethod-actions";
import { paymentMethodActions } from '../../store/paymentMethod-store/paymentMethod-slice';
import Loading from '../UI/Loading';
import DialogModal from '../DialogModal';
import { Button } from 'primereact/button';
import { Trash2, X } from 'lucide-react';
import { Dropdown } from 'primereact/dropdown';
import { getTokenInfo } from '../../helpers/token';


let once = true;
const PaymentMethods = ({ setActiveTab }) => {
    const isMobile = window.innerWidth <= 480;
    const auth = getTokenInfo();
    const business = useSelector((state) => state.business.business);
    const paymentMethod = useSelector((state) => state.paymentMethod.paymentMethod);
    const paymentMethods = useSelector((state) => state.paymentMethod.paymentMethods);

    const [editingPaymentMethod, setEditingPaymentMethod] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("");
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [paymentMethodErrors, setPaymentMethodErrors] = useState({});
    const [selectedPaymentType, setSelectedPaymentType] = useState(null);
    const [selectedAccountType, setSelectedAccountType] = useState(null);
    const [selectedCurrency, setSelectedCurrency] = useState({
        code: "DOP",
        name: "Peso dominicano",
        symbol: "RD$",
    });


    const dispatch = useDispatch();
    const { showError, showWarning, showSuccess } = useNotification();

    const paymentTypes = [
        { name: "Transferencia Bancaria", code: "bank_transfer" },
        { name: "Link de pago", code: "payment_link" },
    ];
    const accountTypeOptions = [
        { name: "Ahorros", code: "savings" },
        { name: "Corriente", code: "current" },
    ];
    const currencies = [
        { code: "USD", name: "Dólar estadounidense", symbol: "$" },
        { code: "DOP", name: "Peso dominicano", symbol: "RD$" },
    ];

    useEffect(() => {
        if (paymentMethods.length === 0 && once) {
            // setIsLoading(true);
            setLoadingMessage("Cargando métodos de pago...");
            // dispatch(GetPaymentMethods(showError));
            dispatch(paymentMethodActions.startPaymentMethod());
            once = false;
      

            dispatch(
                paymentMethodActions.modifyPropertyValue({
                    id: "business_id",
                    value: business.business_id,
                })
            );
            dispatch(
                paymentMethodActions.modifyPropertyValue({
                    id: "owner_email",
                    value: auth.email,
                })
            );
            setTimeout(() => {
                setIsLoading(false);
            }, 1500);
        }
    }, [business.business_id, dispatch, showError, paymentMethods]);

    const validatePaymentMethod = (data) => {
        const errors = {};

        if (!data.payment_type) errors.payment_type = "El tipo de pago es requerido";
        if (data.payment_type === "bank_transfer") {
            if (!data.account_number) errors.account_number = "El número de cuenta es requerido";
            if (!data.account_type) errors.account_type = "El tipo de cuenta es requerido";
            if (!data.bank_name) errors.bank_name = "El nombre del banco es requerido";
            if (!data.owner_name) errors.owner_name = "El nombre del propietario es requerido";
            if (!data.owner_document) errors.owner_document = "El documento del propietario es requerido";
            if (!data.owner_email) errors.owner_email = "El email del propietario es requerido";
            if (!data.currency) errors.currency = "La moneda es requerida";
        } else {
            if (!data.payment_link) errors.payment_link = "El enlace de pago es requerido";
        }

        return errors;
    };

    const handlePaymentMethodSubmit = (e) => {
        e.preventDefault();

        const errors = validatePaymentMethod(paymentMethod);
        setPaymentMethodErrors(errors);

        if (Object.keys(errors).length === 0) {

            setIsLoading(true);
            if (paymentMethod.payment_method_id) {
                setLoadingMessage("Actualizando método de pago...");
                dispatch(UpdatePaymentMethod(paymentMethod, showError, showWarning, showSuccess));
            } else {
                setLoadingMessage("Creando método de pago...");
                dispatch(CreatePaymentMethod(paymentMethod, showError, showWarning, showSuccess));
            }
            setTimeout(() => {
                setActiveTab("paymentMethods");
                dispatch(GetPaymentMethods(showError));
                dispatch(paymentMethodActions.startPaymentMethod());
                setEditingPaymentMethod(false);
                setIsLoading(false);
            }, 1500);
        }
    };

    const handleEditPaymentMethod = (paymentMethod) => {
        dispatch(paymentMethodActions.setPaymentMethod({ paymentMethod: paymentMethod }));
        setEditingPaymentMethod(true);
    };

    const handleDeletePaymentMethod = (showDialog, paymentMethod) => {
        setShowDeleteDialog(showDialog);
        dispatch(paymentMethodActions.setPaymentMethod({ paymentMethod: paymentMethod }));
    };
    const footerContent = (
        <div>
            <Button
                className="btn btn-secondary"
                label="No"
                icon={<X />}
                onClick={() => setShowDeleteDialog(false)}
                style={{ width: "100px", margin: "2px" }}
            />
            <Button
                className="btn btn-danger"
                label="Si"
                icon={<Trash2 />}
                onClick={() => {
                    setIsLoading(true);
                    setLoadingMessage("Eliminando método de pago...");
                    dispatch(
                        DeletePaymentMethod(
                            paymentMethod.payment_method_id,
                            showError,
                            showWarning,
                            showSuccess
                        )
                    );

                    setTimeout(() => {
                        setActiveTab("Métodos de pago");
                        dispatch(GetPaymentMethods(showError));
                        dispatch(paymentMethodActions.startPaymentMethod());
                        setIsLoading(false);
                        setShowDeleteDialog(false);
                    }, 1500);
                }}
                style={{ width: "100px", margin: "2px" }}
            />
        </div>
    );

    return (
        <>
            <DialogModal
                title="Eliminar Método de Pago"
                visible={showDeleteDialog}
                onHide={() => setShowDeleteDialog(false)}
                footer={footerContent}
            >
                <p>¿Estás seguro de que deseas eliminar este método de pago?</p>
            </DialogModal>
            <Loading message={loadingMessage} visible={isLoading} />
            <div>
                <div className="admin-header">
                    <h1>Gestión de Métodos de Pago</h1>
                    <p>Crea métodos de pago para tu negocio</p>
                </div>

                <div className="admin-card">
                    <h2>{editingPaymentMethod ? "Editar Método de Pago" : "Nuevo Método de Pago"}</h2>
                    <form onSubmit={handlePaymentMethodSubmit}>
                        <div className="form-group">
                            <label className="form-label">Método de Pago *</label>
                            <Dropdown
                                value={selectedPaymentType}
                                className={`input ${paymentMethodErrors.payment_type ? "error" : ""}`}
                                onChange={(e) => {
                                    setSelectedPaymentType(e.value);
                                    dispatch(
                                        paymentMethodActions.modifyPropertyValue({
                                            id: "payment_type",
                                            value: e.value.symbol,
                                        })
                                    );
                                }}
                                options={paymentTypes}
                                optionLabel="name"
                                placeholder="Seleccionar método de pago"
                            />
                            {paymentMethodErrors.payment_type && (
                                <div className="error-message">{paymentMethodErrors.payment_type}</div>
                            )}
                        </div>
                        {selectedPaymentType && selectedPaymentType.code === "bank_transfer" && (
                            <>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Número de Cuenta *</label>
                                        <InputText
                                            type="text"
                                            className="input"
                                            value={paymentMethod.account_number}
                                            onChange={(e) => {
                                                dispatch(
                                                    paymentMethodActions.modifyPropertyValue({
                                                        id: "account_number",
                                                        value: e.target.value,
                                                    })
                                                );
                                            }}
                                            placeholder="123456789"
                                        />
                                        {paymentMethodErrors.account_number && (
                                            <div className="error-message">{paymentMethodErrors.account_number}</div>
                                        )}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Nombre del Banco *</label>
                                        <InputText
                                            type="text"
                                            className="input"
                                            value={paymentMethod.bank_name}
                                            onChange={(e) => {
                                                dispatch(
                                                    paymentMethodActions.modifyPropertyValue({
                                                        id: "bank_name",
                                                        value: e.target.value,
                                                    })
                                                );
                                            }}
                                            placeholder="Banco XYZ"
                                        />
                                        {paymentMethodErrors.bank_name && (
                                            <div className="error-message">{paymentMethodErrors.bank_name}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Nombre del Propietario *</label>
                                        <InputText
                                            type="text"
                                            className="input"
                                            value={paymentMethod.owner_name}
                                            onChange={(e) => {
                                                dispatch(
                                                    paymentMethodActions.modifyPropertyValue({
                                                        id: "owner_name",
                                                        value: e.target.value,
                                                    })
                                                );
                                            }}
                                            placeholder="Juan Pérez"
                                        />
                                        {paymentMethodErrors.owner_name && (
                                            <div className="error-message">{paymentMethodErrors.owner_name}</div>
                                        )}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Número de Documento *</label>
                                        <InputText
                                            type="text"
                                            className="input"
                                            value={paymentMethod.owner_document}
                                            onChange={(e) => {
                                                dispatch(
                                                    paymentMethodActions.modifyPropertyValue({
                                                        id: "owner_document",
                                                        value: e.target.value,
                                                    })
                                                );
                                            }}
                                            placeholder="12345678789"
                                        />
                                        {paymentMethodErrors.owner_document && (
                                            <div className="error-message">{paymentMethodErrors.owner_document}</div>
                                        )}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email del Propietario *</label>
                                        <InputText
                                            type="text"
                                            className="input"
                                            value={paymentMethod.owner_email}
                                            onChange={(e) => {
                                                dispatch(
                                                    paymentMethodActions.modifyPropertyValue({
                                                        id: "owner_email",
                                                        value: e.target.value,
                                                    })
                                                );
                                            }}
                                            placeholder="juan@example.com"
                                        />
                                        {paymentMethodErrors.owner_email && (
                                            <div className="error-message">{paymentMethodErrors.owner_email}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Tipo de Cuenta *</label>
                                        <Dropdown
                                            value={selectedAccountType}
                                            className={`input ${paymentMethodErrors.account_type ? "error" : ""}`}
                                            onChange={(e) => {
                                                setSelectedAccountType(e.value);
                                                dispatch(
                                                    paymentMethodActions.modifyPropertyValue({
                                                        id: "account_type",
                                                        value: e.value.symbol,
                                                    })
                                                );
                                            }}
                                            options={accountTypeOptions}
                                            optionLabel="name"
                                            placeholder="Seleccionar tipo de cuenta"
                                        />
                                        {paymentMethodErrors.account_type && (
                                            <div className="error-message">{paymentMethodErrors.account_type}</div>
                                        )}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Moneda *</label>
                                        <Dropdown
                                            value={selectedCurrency}
                                            className={`input ${paymentMethodErrors.currency ? "error" : ""}`}
                                            onChange={(e) => {
                                                setSelectedCurrency(e.value);
                                                dispatch(
                                                    paymentMethodActions.modifyPropertyValue({
                                                        id: "currency",
                                                        value: e.value.symbol,
                                                    })
                                                );
                                            }}
                                            options={currencies}
                                            optionLabel="name"
                                            placeholder="Seleccionar moneda"
                                        />
                                        {paymentMethodErrors.currency && (
                                            <div className="error-message">{paymentMethodErrors.currency}</div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}




                        <div className="form-actions">
                            <Button type="submit" className="btn btn-primary">
                                {editingPaymentMethod ? "Actualizar" : "Crear"} Categoría
                            </Button>
                            {editingPaymentMethod && (
                                <Button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => {
                                        dispatch(categoryActions.startPaymentMethod(false));
                                        setEditingPaymentMethod(false);
                                    }}
                                >
                                    Cancelar
                                </Button>
                            )}
                        </div>
                    </form>
                </div>

                {/* <div className="admin-card">
                    <h2>Categorías Existentes</h2>
                    {categories.length === 0 ? (
                        <p>No hay categorías creadas aún.</p>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map((category) => (
                                    <tr key={category.category_id}>
                                        <td>{category.name}</td>
                                        <td>
                                            <div className="table-actions">
                                                <Button
                                                    className="btn btn-small btn-outline"
                                                    onClick={() => {
                                                        handleEditPaymentMethod(category);
                                                    }}
                                                    icon={<PencilIcon />}

                                                />
                                                <Button
                                                    className="btn btn-small btn-danger"
                                                    onClick={() => {
                                                        handleDeletePaymentMethod(true, category);
                                                    }}
                                                    icon={<Trash2 />}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div> */}
            </div>
        </>
    );
};

export default PaymentMethods;
