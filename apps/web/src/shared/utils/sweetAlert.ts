import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export const confirmDelete = (onConfirm: () => void) => {
  MySwal.fire({
    title: 'Tem certeza?',
    text: 'Esta ação não poderá ser desfeita.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#4f46e5',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Sim, excluir!',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (result.isConfirmed) {
      onConfirm();
    }
  });
};

export const showAlert = (title: string, text: string, icon: 'success' | 'error' | 'info' | 'warning' = 'info') => {
  MySwal.fire({
    title,
    text,
    icon,
    confirmButtonColor: '#4f46e5'
  });
};
