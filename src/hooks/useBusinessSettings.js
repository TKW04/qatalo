// src/hooks/useBusinessSettings.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// Importaremos tu función real que hace el fetch a tu API Gateway
// import { fetchBusinessData, updateBusinessData } from '../services/api'; 

export const useBusinessSettings = (tenantId) => {
  const queryClient = useQueryClient();

  // 1. Obtener la configuración de la tienda
  const businessQuery = useQuery({
    queryKey: ['business', tenantId],
    queryFn: () => fetchBusinessData(tenantId),
    staleTime: 1000 * 60 * 5, // Los datos se consideran "frescos" por 5 minutos
  });

  // 2. Actualizar la configuración (Ej: Cambiar la paleta)
  const updateSettingsMutation = useMutation({
    mutationFn: (newData) => updateBusinessData(tenantId, newData),
    onSuccess: () => {
      // Obliga a TanStack a refrescar los datos cacheados
      queryClient.invalidateQueries(['business', tenantId]);
    },
  });

  return {
    business: businessQuery.data,
    isLoading: businessQuery.isLoading,
    isError: businessQuery.isError,
    updateSettings: updateSettingsMutation.mutate,
    isUpdating: updateSettingsMutation.isPending
  };
};