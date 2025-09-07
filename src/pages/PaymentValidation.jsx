import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { GetCustomerTransaction } from "../store/customer-store/customer-actions";
import { useNotification } from "../components/UI/NotificationProvider";

const PaymentValidation = () => {
  const params = useParams();
  const dispatch = useDispatch();
  const {showError} = useNotification();
  const customer =useSelector((state) => state.customer.customer);

  const customer_id = params.customer_id;

  useEffect(() => {
    dispatch(GetCustomerTransaction(customer_id, showError));
  }, [customer_id, dispatch, showError]);
  console.log(customer);

  return <div>PaymentValidation</div>;
};
export default PaymentValidation;
