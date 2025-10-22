import { getToken } from "../../helpers/token";
import { productActions } from "./product-slice";

export const CreateProduct = (
  product,
  business,
  showError,
  showWarning,
  showSuccess
) => {
  return async () => {
    const RegisterProductInfo = async () => {
      const productForm = new FormData();
      productForm.append("business_id", business.business_id);
      productForm.append("name", product.name);
      productForm.append("description", product.description);
      productForm.append("price", product.price);
      productForm.append("quantity", product.quantity);
      productForm.append("currency", product.currency);
      productForm.append("category_id", product.category_id);
      productForm.append("is_available", product.is_available);
      productForm.append("orden", product.orden);
      productForm.append("just_one", product.just_one);
      productForm.append("show_quantity", product.show_quantity);
      productForm.append("terms", product.terms);
      productForm.append("min_age_allow", product.min_age_allow);
      productForm.append("min_age", product.min_age);
      productForm.append("required_delivery_day", product.required_delivery_day);
      productForm.append("delivery_start_day", product.delivery_start_day);
      if (product.image1) productForm.append("image1", product.image1);
      if (product.image2) productForm.append("image2", product.image2);
      if (product.image3) productForm.append("image3", product.image3);
      if (product.image4) productForm.append("image4", product.image4);
      if (product.image5) productForm.append("image5", product.image5);

      return await fetch(`${import.meta.env.VITE_APP_API_URL}products`, {
        method: "POST",
        body: productForm,
        headers: {
          Authorization: getToken(),
        },
      });
    };

    try {
      const response = await RegisterProductInfo();
      if (response.status === 200) {
        showSuccess("Producto guardado", "Producto guardado con éxito");
      } else {
        showWarning(
          "No se pudo crear el producto",
          "Valide los datos ingresados"
        );
      }
    } catch (error) {
      console.log(error);
      showError("Error!", "No se pudieron obtener los usuarios");
    }
  };
};
export const GetProducts = (showError) => {
  return async (dispatch) => {
    const FetchProductInfo = async () => {
      return await fetch(`${import.meta.env.VITE_APP_API_URL}products`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: getToken(),
        },
      });
    };

    try {
      const response = await FetchProductInfo();
      if (response.status === 200) {
        let data = await response.json();
        if (data === null) {
          data = [];
        }
        dispatch(productActions.setProducts({ products: data }));
      }
    } catch (error) {
      console.log(error);
      showError("Error!", "No se pudieron obtener los productos");
    }
  };
};
export const GetProductsByBusinessId = (businessId, showError) => {
  return async (dispatch) => {
    const FetchProductInfo = async () => {
      return await fetch(
        `${import.meta.env.VITE_APP_API_URL}products/${businessId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: getToken(),
          },
        }
      );
    };

    try {
      const response = await FetchProductInfo();
      if (response.status === 200) {
        let data = await response.json();
        if (data === null) {
          data = [];
        }

        dispatch(productActions.setProducts({ products: data }));
      }
    } catch (error) {
      console.log(error);
      showError("Error!", "No se pudieron obtener los productos");
    }
  };
};
export const UpdateProduct = (
  product,
  business,
  showError,
  showWarning,
  showSuccess
) => {
  return async () => {
    const UpdateProductInfo = async () => {
      const productForm = new FormData();
      productForm.append("business_id", business.business_id);
      productForm.append("name", product.name);
      productForm.append("description", product.description);
      productForm.append("price", product.price);
      productForm.append("quantity", product.quantity);
      productForm.append("currency", product.currency);
      productForm.append("category_id", product.category_id);
      productForm.append("is_available", product.is_available);
      productForm.append("orden", product.orden);
      productForm.append("just_one", product.just_one);
      productForm.append("show_quantity", product.show_quantity);
      productForm.append("terms", product.terms);
      productForm.append("min_age_allow", product.min_age_allow);
      productForm.append("min_age", product.min_age);
      productForm.append("imagesUrl", product.imagesUrl);
      productForm.append("required_delivery_day", product.required_delivery_day);
      productForm.append("delivery_start_day", product.delivery_start_day);
      if (product.image1) productForm.append("image1", product.image1);
      if (product.image2) productForm.append("image2", product.image2);
      if (product.image3) productForm.append("image3", product.image3);
      if (product.image4) productForm.append("image4", product.image4);
      if (product.image5) productForm.append("image5", product.image5);

      return await fetch(
        `${import.meta.env.VITE_APP_API_URL}products/${product.product_id}`,
        {
          method: "PUT",
          body: productForm,
          headers: {
            Authorization: getToken(),
          },
        }
      );
    };
    try {
      const response = await UpdateProductInfo();
      if (response.status === 200) {
        showSuccess("Producto actualizado", "Producto actualizado con éxito");
      } else {
        showWarning(
          "No se pudo actualizar el producto",
          "Valide los datos ingresados"
        );
      }
    } catch (error) {
      console.log(error);
      showError("Error!", "No se pudieron obtener los productos");
    }
  };
};
export const DeleteProduct = (
  productId,
  showError,
  showWarning,
  showSuccess
) => {
  return async () => {
    const DeleteProductInfo = async () => {
      return await fetch(
        `${import.meta.env.VITE_APP_API_URL}products/${productId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: getToken(),
          },
        }
      );
    };
    try {
      const response = await DeleteProductInfo();
      if (response.status === 200) {
        showSuccess("Producto eliminado", "Producto eliminado con éxito");
      } else {
        showWarning(
          "No se pudo eliminar el producto",
          "Valide los datos ingresados"
        );
      }
    } catch (error) {
      console.log(error);
      showError("Error!", "No se pudieron obtener los productos");
    }
  };
};

export const DeleteImage = (
  productId,
  imageUrl,
  showError,
  showWarning,
  showSuccess
) => {
  return async () => {
    const DeleteProductInfo = async () => {
      return await fetch(
        `${import.meta.env.VITE_APP_API_URL}products/delete/image`,
        {
          method: "DELETE",
          body: JSON.stringify({ product_id: productId, file_url: imageUrl }),
          headers: {
            Authorization: getToken(),
          },
        }
      );
    };
    try {
      const response = await DeleteProductInfo();
      if (response.status === 200) {
        showSuccess("Imagen eliminada", "Imagen eliminada con éxito");
      } else {
        showWarning(
          "No se pudo eliminar la imagen",
          "Valide los datos ingresados"
        );
      }
    } catch (error) {
      console.log(error);
      showError("Error!", "No se pudieron obtener los productos");
    }
  };
};
