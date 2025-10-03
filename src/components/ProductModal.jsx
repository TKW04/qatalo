import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Image } from "primereact/image";

import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";

import {
  Check,
  ChevronLeftIcon,
  ChevronRightIcon,
  MessageCircle,
  ShoppingCart,
  X,
} from "lucide-react";

import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";

import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";

import { customerActions } from "../store/customer-store/customer-slice";
import { GetPaymentMethodsByBusinessId } from "../store/paymentMethod-store/paymentMethod-actions";
import { useNotification } from "./UI/NotificationProvider";
import DialogModal from "./DialogModal";

import { CreateCustomer } from "../store/customer-store/customer-actions";
import Loading from "./UI/Loading";
import { InputSwitch } from "primereact/inputswitch";
import { Dialog } from "primereact/dialog";
import "../styles/components.css";
import { formatted } from "../helpers/utils";

let once = true;
const ProductModal = ({ product, business, onClose }) => {
  const dispatch = useDispatch();
  const { showError, showSuccess, showWarning } = useNotification();

  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const isMobile = window.innerWidth <= 760;

  const paymentMethods = useSelector(
    (state) => state.paymentMethod.paymentMethods
  );

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const customer = useSelector((state) => state.customer.customer);
  const [action, setAction] = useState("whatsapp");
  const [paymentMethod, setPaymentMethod] = useState(null);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const [acceptTerms, setAcceptTerms] = useState(false);
  const [termsDialog, setShowTermsDialog] = useState(false);

  const [sliderRef, instanceRef] = useKeenSlider({
    initial: 0,
    slideChanged(slider) {
      setCurrentSlide(slider.track.details.rel);
    },
    created() {
      setLoaded(true);
    },
  });

  useEffect(() => {
    if (once) {
      dispatch(GetPaymentMethodsByBusinessId(business.business_id, showError));
      once = false;
    }
  }, [dispatch, business, showError]);

  useEffect(() => {
    if (
      product &&
      product.product_id !== undefined &&
      product.product_id !== null &&
      product.product_id !== "" &&
      (product.terms === null ||
        product.terms === undefined ||
        product.terms === "")
    ) {
      setAcceptTerms(true);
    }
  }, [product]);

  const productTemplate = (image) => {
    return (
      <>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
          }}
        >
          <Button
            rounded
            icon={<ChevronLeftIcon color="var(--color-sea)" />}
            style={{
              width: "40px",
              height: "40px",
              backgroundColor: "transparent",
              border: "1px solid var(--color-sea)",
            }}
            className="image-arrow-left"
            onClick={(e) => e.stopPropagation() || instanceRef.current?.prev()}
          />
          <div className="image-carousel">
            <Image
              preview
              src={image}
              alt="image"
              width={isMobile ? "400px" : "500px"}
              height="290"
              style={{ objectFit: "fill" }}
            />
          </div>
          <Button
            icon={<ChevronRightIcon color="var(--color-sea)" />}
            className="image-arrow-right"
            style={{
              width: "40px",
              height: "40px",
              backgroundColor: "transparent",
              border: "1px solid var(--color-sea)",
            }}
            onClick={(e) => e.stopPropagation() || instanceRef.current?.next()}
          />
        </div>
      </>
    );
  };

  const handleWhatsApp = () => {
    const catalogUrl = window.location.href;

    const message = `Hola, soy ${customer.given_name || "el cliente"} ${
      customer.family_name || ""
    }, estoy interesad@ en "${
      product.name
    }". Lo vi en tu catálogo: ${catalogUrl}`;
    const whatsappUrl = `https://wa.me/${
      business.phone
    }?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, "_blank");
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const onCreate = (action) => {
    setShowCustomerDialog(false);
    if (action === "whatsapp") {
      handleWhatsApp();
    }
    if (action === "buy") {
      setShowBuyDialog(true);
    }
  };

  const onBuy = () => {
    const customerCreate = {
      ...customer,
      business_id: business.business_id,
      transaction: {
        product_id: product.product_id,
        product_name: product.name,
        quantity: customer.transaction_quantity,
        price: product.price,
        status: "Pendiente de pago",
        accept_terms: acceptTerms,
        payment_method: {
          payment_method_id: paymentMethods.find(
            (pm) => pm.payment_method_id === paymentMethod.code
          )?.payment_method_id,
          payment_type: paymentMethods.find(
            (pm) => pm.payment_method_id === paymentMethod.code
          )?.payment_type,
          currency: product.currency,
          payment_link: paymentMethods.find(
            (pm) => pm.payment_method_id === paymentMethod.code
          )?.payment_link,
        },
      },
    };

    setIsLoading(true);
    setLoadingMessage("Creando Solicitud...");
    dispatch(CreateCustomer(customerCreate, showWarning, showSuccess));

    setTimeout(() => {
      setShowCustomerDialog(false);
      setShowBuyDialog(false);
      setShowPaymentDialog(true);
      setIsLoading(false);
    }, 4500);
  };

  const handleCustomerCreation = (customer_action) => {
    setAction(customer_action);
    setShowCustomerDialog(true);
  };

  return (
    <>
      <Loading message={loadingMessage} visible={isLoading} />
      <div className="modal-overlay" onClick={handleOverlayClick}>
        <Dialog
          visible={termsDialog}
          position={"center"}
          className="termisModal"
          onHide={() => setShowTermsDialog(false)}
          draggable={false}
          resizable={false}
        >
          <div
            style={{
              textAlign: "left",
              padding: "5px",
              overflowY: "hidden",
            }}
          >
            <span
              style={{
                textAlign: "center",
                fontSize: "24px",
                fontWeight: "bold",
                color: "#fff",
                alignItems: "center",
                display: "flex",
                justifyContent: "center",
                marginBottom: "10px",
                borderBottom: "2px solid var(--color-yellow)",
                paddingBottom: "5px",
                width: "100%",
              }}
            >
              Términos y Condiciones
            </span>
            <p
              style={{
                fontSize: "18px",
                color: "#fff",
                textAlign: "justify",
                padding: "10px",
                wordSpacing: "2px",
                lineHeight: "1.6",
              }}
            >
              {product.terms}
            </p>
          </div>
        </Dialog>
        {/* Modal de creacion de usuario */}
        <DialogModal
          visible={showCustomerDialog}
          onHide={() => setShowCustomerDialog(false)}
        >
          <div
            style={{ textAlign: "left", padding: "5px", overflowX: "hidden" }}
          >
            <div style={{ width: "100%", textAlign: "left" }}>
              <div className="field col">
                <label className="form-label">Nombre</label>
                <InputText
                  type="text"
                  className="input"
                  value={customer.given_name}
                  onChange={(e) => {
                    dispatch(
                      customerActions.modifyPropertyValue({
                        id: "given_name",
                        value: e.target.value,
                      })
                    );
                  }}
                  placeholder="Juan"
                />
              </div>
              <div className="field col">
                <label className="form-label">Apellido</label>
                <InputText
                  type="text"
                  className="input"
                  value={customer.family_name}
                  onChange={(e) => {
                    dispatch(
                      customerActions.modifyPropertyValue({
                        id: "family_name",
                        value: e.target.value,
                      })
                    );
                  }}
                  placeholder="Pérez"
                />
              </div>
              <div className="field col">
                <label className="form-label">Correo Electrónico</label>
                <InputText
                  type="text"
                  className="input"
                  value={customer.email}
                  onChange={(e) => {
                    dispatch(
                      customerActions.modifyPropertyValue({
                        id: "email",
                        value: e.target.value,
                      })
                    );
                  }}
                  placeholder="juan@example.com"
                />
              </div>
              <div className="field col">
                <label className="form-label">Teléfono</label>
                <InputText
                  type="text"
                  className="input"
                  value={customer.phone}
                  onChange={(e) => {
                    dispatch(
                      customerActions.modifyPropertyValue({
                        id: "phone",
                        value: e.target.value,
                      })
                    );
                  }}
                  placeholder="809-555-1234"
                />
              </div>
              <div className="flex justify-content-end">
                <Button
                  className="btn btn-primary"
                  label="Continuar"
                  icon={<Check />}
                  onClick={() => onCreate(action)}
                  style={{ width: "100px", margin: "2px" }}
                />
                <Button
                  className="btn btn-danger"
                  label="Cancelar"
                  icon={<X />}
                  onClick={() => setShowCustomerDialog(false)}
                  style={{ width: "100px", margin: "2px" }}
                />
              </div>
            </div>
          </div>
        </DialogModal>
        {/* Modal de compra */}
        <DialogModal
          visible={showBuyDialog}
          onHide={() => setShowBuyDialog(false)}
        >
          <div
            style={{
              textAlign: "left",
              padding: "5px",
              overflowX: "hidden",
            }}
          >
            <div style={{ width: "100%", textAlign: "left" }}>
              <div className="field col">
                <label className="form-label">Método de pago</label>
                <Dropdown
                  value={paymentMethod}
                  className="input"
                  onChange={(e) => {
                    setPaymentMethod(e.value);
                  }}
                  options={paymentMethods.map((method) => ({
                    name: method.payment_method_name,
                    code: method.payment_method_id,
                  }))}
                  optionLabel="name"
                  placeholder="Método de pago"
                />
              </div>
              <div className="field col">
                <label className="form-label">
                  Cantidad
                  {product.show_quantity && (
                    <span style={{ color: "white" }}>
                      {" "}
                      ({product.quantity} Disponible)
                    </span>
                  )}
                </label>
                <InputNumber
                  className={`input ${product.just_one ? "pii" : ""}`}
                  value={customer.transaction_quantity}
                  disabled={product.just_one}
                  min={1}
                  max={product.show_quantity ? product.quantity : 1000}
                  style={{
                    width: "100%",
                    backgroundColor:
                      product.just_one === true ? "gray" : "white",
                    color:
                      product.just_one === true
                        ? "var(--color-yellow)"
                        : "white",
                  }}
                  onChange={(e) => {
                    if (e.value <= product.quantity) {
                      dispatch(
                        customerActions.modifyPropertyValue({
                          id: "transaction_quantity",
                          value: e.value,
                        })
                      );
                    } else {
                      showWarning(
                        "La cantidad excede el inventario disponible"
                      );
                    }
                  }}
                />
              </div>
              {product.terms && (
                <div className="field col flex align-items-center">
                  <label className="form-label">
                    <Button
                      style={{
                        backgroundColor: "transparent",
                        border: "none",
                        padding: 0,
                        textDecoration: "underline",
                        color: "var(--color-yellow)",
                      }}
                      label="Términos y condiciones"
                      onClick={() => setShowTermsDialog(true)}
                    />
                    {product.show_quantity && (
                      <span style={{ color: "white" }}>
                        {product.quantity} Disponible
                      </span>
                    )}
                  </label>{" "}
                  <div className="field col-5 flex align-items-center">
                    <InputSwitch
                      checked={acceptTerms}
                      onChange={(e) => {
                        setAcceptTerms(e.value);
                      }}
                    />
                  </div>
                </div>
              )}
              <div className="flex justify-content-end">
                <Button
                  disabled={
                    !paymentMethod ||
                    !customer.transaction_quantity ||
                    !acceptTerms
                  }
                  className={`btn ${
                    paymentMethod &&
                    customer.transaction_quantity &&
                    acceptTerms
                      ? "btn-success"
                      : "btn-disabled"
                  }`}
                  label="Guardar"
                  icon={<Check />}
                  onClick={() => onBuy()}
                  style={{ width: "100px", margin: "2px" }}
                />
                <Button
                  className="btn btn-danger"
                  label="Cancelar"
                  icon={<X />}
                  onClick={() => setShowBuyDialog(false)}
                  style={{ width: "100px", margin: "2px" }}
                />
              </div>
            </div>
          </div>
        </DialogModal>
        {/* Modal de información */}
        <Dialog
          visible={showPaymentDialog}
          onHide={() => setShowPaymentDialog(false)}
          header={"Solicitud Enviada"}
          className={"termisModal"}
        >
          <div
            style={{ textAlign: "left", padding: "5px", overflowX: "hidden" }}
          >
            <div
              style={{
                width: "100%",
                textAlign: "center",
                border: "1px solid var(--color-yellow)",
                borderRadius: "8px",
                padding: "10px",
              }}
            >
              <p style={{ color: "white" }}>
                Su solicitud ha sido enviada con éxito. En breve recibirá una
                notificación. En caso de no encontrarla en su bandeja de
                entrada, por favor verifique su carpeta de{" "}
                <span style={{ color: "var(--color-yellow)" }}>
                  spam, promociones o correo no deseado
                </span>
                .
              </p>
              <p style={{ color: "white" }}>Gracias por su preferencia.</p>
            </div>{" "}
          </div>
        </Dialog>
        <div
          className="modal-content product-modal-content"
          style={{
            // height: "610px",
            maxHeight: "800px",
            overflowY: "auto",
          }}
        >
          <div className="product-modal-header">
            <div className="navigation-wrapper">
              <div
                ref={sliderRef}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "0px",
                  margin: "0px",
                  width: "100%",
                }}
              >
                {product.imagesUrl.map((imgObj, index) => (
                  <div className="keen-slider__slide number-slide1" key={index}>
                    {productTemplate(imgObj.image)}
                  </div>
                ))}
              </div>
            </div>
            <button
              className="product-modal-close"
              onClick={onClose}
              aria-label="Cerrar modal"
            >
              ✕
            </button>
          </div>

          <div
            className="product-modal-body"
            style={{ borderTop: "4px dashed var(--color-navy)" }}
          >
            <h2 className="product-modal-title">{product.name}</h2>
            <div className="product-modal-price">
              {product.currency} {formatted(product.price)}
            </div>

            {product.description && (
              <p className="product-modal-description">{product.description}</p>
            )}

            <div className="product-modal-actions">
              {product.is_available === "available" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    gap: "12px",
                  }}
                >
                  <Button
                    icon={<ShoppingCart size={40} />}
                    style={{ width: "100%" }}
                    className="btn btn-primary"
                    label="Comprar"
                    onClick={() => handleCustomerCreation("buy")}
                  />
                  <Button
                    style={{ width: "100%" }}
                    icon={<MessageCircle size={40} />}
                    className="btn btn-whatsapp"
                    label="Contactar por WhatsApp"
                    onClick={() => handleCustomerCreation("whatsapp")}
                  />
                </div>
              )}
              {product.is_available === "unavailable" && (
                <Button
                  style={{ width: "100%" }}
                  className="btn"
                  label="Producto agotado"
                  disabled
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductModal;
