import Parent from './components/Parent.vue';
import About from './components/About.vue';
import Home from './components/Home/Home.vue';
import Landing from './components/Landing/Landing.vue';
import AllAssets from './components/AllAssets.vue'
import Profile from './components/MyProfile.vue';
import CreateArt from './components/CreateArt/CreateArt.vue';
import UploadAssetPacks from './components/UploadPack/UploadAssetPacks.vue';
export default [
  { path: '/', component: Home },
  { path: '/legacy', component: Parent },
  { path: '/about', component: About },
  { path: '/landing', component: Landing },
  { path: '/create', component: CreateArt },
  // { path: '/gallery', component: About },
  { path: '/create_asset_pack', component: UploadAssetPacks},
  { path: '/asset_packs', component: AllAssets },
  { path: '/profile', component: Profile },
];