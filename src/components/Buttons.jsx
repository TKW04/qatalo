import { FaInfoCircle } from "react-icons/fa";
import { LuPencil } from "react-icons/lu";
import { FaTrashCan } from "react-icons/fa6";
import { IoMdRefresh } from "react-icons/io";
import { Button } from "primereact/button";
import { GiCancel } from "react-icons/gi";
import { IoMdCheckmark } from "react-icons/io";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import { TbTruckDelivery } from "react-icons/tb";
import { GoPlus } from "react-icons/go";

import buttonStyles from "./Buttons.module.css";


export const EditButton = ({ onClick }) => {
  return (
    <Button
      icon={<LuPencil className={buttonStyles.buttonIcon} />}
      raised
      label={"Editar"}
      className={buttonStyles.editButton}
      onClick={onClick}
    />
  );
};
export const DeleteButton = ({ onClick }) => {
  return (
    <Button
      icon={<FaTrashCan />}
      raised
      label={"Eliminar"}
      className={buttonStyles.deleteButton}
      onClick={onClick}
    />
  );
};
export const InfoButton = ({ onClick }) => {
  return (
    <Button
      icon={<FaInfoCircle style={{ marginLeft: "5px" }} />}
      raised
      label="Info"
      className={buttonStyles.infoButton}
      onClick={onClick}
    />
  );
};

export const RefreshButton = ({ onClick }) => {
  return (
    <Button
      outlined
      type="button"
      icon={<IoMdRefresh size={24} color="var(--color-navy)" />}
      value={""}
      style={{
        border: "none",
        margin: "5px",
      }}
      onClick={onClick}
    />
  );
};

export const YesNoButton = ({ label, onClick }) => {
  return (
    <Button
      icon={
        label === "Sí" ? (
          <IoMdCheckmark style={{ marginLeft: "2px" }} />
        ) : (
          <GiCancel style={{ marginLeft: "2px" }} />
        )
      }
      label={label}
      onClick={onClick}
      className={
        label === "Sí"
          ? `${buttonStyles.yesNoButton} ${buttonStyles.yes}`
          : `${buttonStyles.yesNoButton} ${buttonStyles.no}`
      }
    />
  );
};

export const ValidatePaymentButton = ({ onClick }) => {
  return (
    <Button
    className={buttonStyles.validatePaymentButton}
      icon={<IoMdCheckmarkCircleOutline />}
      raised
      label="Validar pago"
     
      onClick={onClick}
    />
  );
};

export const SentOrderButton = ({ onClick }) => {
  return (
    <Button
      className={buttonStyles.sentOrderButton}
      icon={<TbTruckDelivery />}
      raised
      label="Entregada"
      onClick={onClick}
    />
  );
}
export const AddTransactionButton = ({ onClick }) => {
  return (
    <Button
      className={buttonStyles.addTransactionButton}
      icon={<GoPlus />}
      raised
      label="Transacción"
      onClick={onClick}
    />
  );
};
