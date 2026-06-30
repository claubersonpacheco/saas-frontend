import { createApp } from 'vue';
import { HSStaticMethods } from 'preline';
import App from './App.vue';
import { router } from './router';
import { setDocumentTitle } from './stores/branding';
import './styles.css';

router.afterEach((to, _from, failure) => {
  if (failure) {
    return;
  }

  setDocumentTitle(typeof to.meta.title === 'string' ? to.meta.title : null);

  window.setTimeout(() => {
    HSStaticMethods.autoInit();
  });
});

createApp(App).use(router).mount('#app');
