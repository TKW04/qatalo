import { Info, PencilIcon, Trash2 } from "lucide-react";
import { Button } from "primereact/button";

export const EditButton = ({ onClick }) => {
  return (
    <Button
      icon={<PencilIcon />}
      raised
      label={"Editar"}
      style={{
        height: "40px",
        width: "108px",
        backgroundColor: "var(--color-blue)",
        border: "1px solid ",
        color: "white",
        borderRadius: "5px",
        paddingLeft: "5px",
      }}
      onClick={onClick}
    />
  );
};
export const DeleteButton = ({ onClick }) => {
  return (
    <Button
      icon={<Trash2 />}
      raised
      label={"Eliminar"}
      style={{
        height: "40px",
        width: "108px",
        backgroundColor: "#e74c3c",
        border: "1px solid ",
        color: "white",
        borderRadius: "5px",
        paddingLeft: "5px",
      }}
      onClick={onClick}
    />
  );
};

export const InfoButton = ({ onClick }) => {
  return (
    <Button
      icon={<Info />}
      raised
      label="Info"
      style={{
        height: "40px",
        width: "108px",
        backgroundColor: "#3498db",
        border: "1px solid ",
        color: "white",
        borderRadius: "5px",
        paddingLeft: "5px",
      }}
      onClick={onClick}
    />
  );
};
