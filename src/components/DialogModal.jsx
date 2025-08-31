import { Dialog } from "primereact/dialog";
const DialogModal = ({
  title,
  children,
  footer,
  visible,
  onHide
}) => {
  return (
    <Dialog
      header={title}
      visible={visible}
      position={"center"}
      style={{ width: "50vw" }}
      onHide={onHide}
      footer={footer}
      draggable={false}
      resizable={false}
    >
      {children}
    </Dialog>
  );
};
export default DialogModal;
