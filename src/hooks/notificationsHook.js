import {msgActions} from "../store/message";
import {useDispatch, useSelector} from "react-redux";
import {useEffect} from "react";
import {toast} from "react-toastify";
import {authActions} from "../store/auth";

const useNotifications = () => {
    const dispatch = useDispatch();

    const isSuccess = useSelector(state => state.msg.success);
    const error = useSelector(state => state.msg.error);
    const message = useSelector(state => state.msg.message);

    const user = useSelector(state => state.auth.user);
    const authToken = useSelector(state => state.auth.token);
    const isAuthenticated = useSelector(state => state.auth.isAuthenticated);

    const notificationSuccess = (message) => {
        dispatch(msgActions.success(message))
    }
    const notificationError = (message) => {
        dispatch(msgActions.error(message))
    }
    const notificationClear = () => {
        dispatch(msgActions.clear())
    }
    const useNotificationEffect = () => {
        useEffect(() => {
            if (isSuccess) {
                toast.success(message, {autoClose: 2000});
                notificationClear();
            }
            if (error) {
                toast.error(message, {autoClose: 2000});
                notificationClear();
            }
        }, [isSuccess, error, message, notificationClear, toast]);
    }
    const logoutHandler = () => {
        dispatch(authActions.logout())
        notificationSuccess('Goodbye!')
    }

    return {
        notificationSuccess,
        notificationError,
        notificationClear,
        useNotificationEffect,
        logoutHandler,
        isSuccess,
        error,
        message,
        user,
        authToken,
        isAuthenticated
    }
}

export default useNotifications;