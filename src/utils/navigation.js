import { CommonActions } from '@react-navigation/native';

// Navigation ref to use navigation outside of components
let navigator;

function setTopLevelNavigator(navigatorRef) {
  navigator = navigatorRef;
}

function navigate(routeName, params) {
  navigator.dispatch(
    CommonActions.navigate({
      name: routeName,
      params,
    })
  );
}

export default {
  navigate,
  setTopLevelNavigator,
};
