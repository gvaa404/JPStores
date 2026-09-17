import Swal from 'sweetalert2';

// Custom Toast instance
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});

export const toastSuccess = (title) => {
  return Toast.fire({
    icon: 'success',
    title,
    iconColor: '#059669'
  });
};

export const toastError = (title) => {
  return Toast.fire({
    icon: 'error',
    title,
    iconColor: '#dc2626'
  });
};

export const alertSuccess = (title, text = '') => {
  return Swal.fire({
    icon: 'success',
    title,
    text,
    confirmButtonColor: '#0f172a',
    iconColor: '#059669'
  });
};

export const alertError = (title, text = '') => {
  return Swal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonColor: '#0f172a',
    iconColor: '#dc2626'
  });
};

export const alertWarning = (title, text = '') => {
  return Swal.fire({
    icon: 'warning',
    title,
    text,
    confirmButtonColor: '#0f172a',
    iconColor: '#d97706'
  });
};

export const alertInfo = (title, text = '') => {
  return Swal.fire({
    icon: 'info',
    title,
    text,
    confirmButtonColor: '#0f172a',
    iconColor: '#2563eb'
  });
};

export const confirmDialog = async ({
  title = 'Are you sure?',
  text = '',
  confirmText = 'Yes, Proceed',
  cancelText = 'Cancel',
  isDestructive = false
}) => {
  const result = await Swal.fire({
    title,
    text,
    icon: isDestructive ? 'warning' : 'question',
    showCancelButton: true,
    confirmButtonColor: isDestructive ? '#dc2626' : '#0f172a',
    cancelButtonColor: '#64748b',
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true
  });
  return result.isConfirmed;
};

export const selectDialog = async ({
  title = 'Select an option',
  inputOptions = {},
  inputValue = '',
  confirmText = 'Update'
}) => {
  const result = await Swal.fire({
    title,
    input: 'select',
    inputOptions,
    inputValue,
    showCancelButton: true,
    confirmButtonColor: '#0f172a',
    cancelButtonColor: '#64748b',
    confirmButtonText: confirmText,
    reverseButtons: true,
    inputValidator: (value) => {
      if (!value) {
        return 'Please select an option';
      }
    }
  });
  if (result.isConfirmed) {
    return result.value;
  }
  return null;
};

export default Swal;
