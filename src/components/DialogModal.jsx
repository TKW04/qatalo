import { Dialog } from "primereact/dialog";

const DialogModal = ({
  title,
  children,
  footer,
  visible,
  onHide,
  width,
}) => {
  const isMobile = window.innerWidth <= 760;
  return (
    <Dialog
      header={title}
      visible={visible}
      position={"center"}
      style={{ width: isMobile ? "100%" : width ? width : "50vw" }}
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
