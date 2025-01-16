// MainApp.js
import React from 'react';
import { Provider } from 'react-redux';
import store from '../../contexts/store';
import { CategoriesProvider } from '../../contexts/CategoriesContext';

import MainAppContent from './MainApp';

function App() {
    return (
        <Provider store={store}>
            <CategoriesProvider>
                <MainAppContent />
            </CategoriesProvider>
        </Provider>
    );
}

export default App;
