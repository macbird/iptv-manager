import { Navigate, useParams } from 'react-router-dom';

export function CreateFormRedirect({ to }: { to: string }) {
  return <Navigate to={to} replace state={{ form: 'create' }} />;
}

export function EditFormRedirect({ to }: { to: string }) {
  const { id } = useParams<{ id: string }>();
  if (!id) {
    return <Navigate to={to} replace />;
  }
  return <Navigate to={to} replace state={{ form: 'edit', id }} />;
}
