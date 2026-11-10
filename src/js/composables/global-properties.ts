// The global properties of the app ($gettext, $user, $documentUtils...), for <script setup>: the template reaches them
// directly, the script through this
import { getCurrentInstance } from 'vue';

export function useGlobalProperties() {
  return getCurrentInstance()!.appContext.config.globalProperties;
}
