import styles from "./DialogModal.module.css";

const DialogModal = ({ title, children, visible, onHide, width }) => {
  if (!visible) return null;

  const isMobile = window.innerWidth <= 760;
  const modalStyle = {
    width: isMobile ? "95%" : (width || "50vw"),
  };

  return (
    <div className={styles.overlay} onClick={onHide}>
      <div 
        className={styles.modal} 
        style={modalStyle} 
        onClick={(e) => e.stopPropagation()} // Evita que se cierre al hacer click dentro
      >
        <div className={styles.header}>{title}</div>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
};

export default DialogModal;