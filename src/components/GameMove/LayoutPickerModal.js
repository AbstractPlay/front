import { useTranslation } from "react-i18next";
import Modal from "../Modal";
import LayoutSwitcher from "./LayoutSwitcher";

function LayoutPickerModal({ show, onClose, layoutId }) {
  const { t } = useTranslation();

  return (
    <Modal
      show={show}
      title={t("gameMove.layout.pickerTitle")}
      buttons={[{ label: t("Close"), action: onClose }]}
    >
      <p className="game-move-layout-picker-modal__intro">
        {t("gameMove.layout.pickerIntro")}
      </p>
      <LayoutSwitcher layoutId={layoutId} variant="modal" onSelect={onClose} />
    </Modal>
  );
}

export default LayoutPickerModal;
