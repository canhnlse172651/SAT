import { CLASS_ERROR_CODES } from '@sat/shared';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ApiError } from '../../lib/api-client';
import { useToastStore } from '../toast/toast-store';
import { myClassesPath } from './paths';

/** AC-14.5, AC-20.7: not (or no longer) a member — tell the HV and go back to S01. */
export function useHvRefusal(error: unknown): void {
  const navigate = useNavigate();
  const push = useToastStore((s) => s.push);
  useEffect(() => {
    if (error instanceof ApiError && error.code === CLASS_ERROR_CODES.CLASS_NOT_MEMBER) {
      push(error.message, 'warn');
      navigate(myClassesPath, { replace: true });
    }
  }, [error, navigate, push]);
}

export const isNotStarted = (error: unknown): error is ApiError =>
  error instanceof ApiError && error.code === CLASS_ERROR_CODES.CLASS_NOT_STARTED;

export const isNotFound = (error: unknown): boolean =>
  error instanceof ApiError && error.status === 404 && error.code === 'NOT_FOUND';
