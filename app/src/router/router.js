import { createRouter, createWebHashHistory } from "vue-router";

const routes = [
	{
		path: "/",
		name: "Home",
		component: () => import("@/views/home/home.vue"),
	},
	{
		path: "/question/:username/:uri",
		name: "Question",
		component: () => import("@/views/question/question.vue"),
		props: true,
	},
	{
		path: "/:catchAll(.*)",
		name: "NotFound",
		component: () => import("@/views/page404/404NotFound.vue"),
	},
];

const router = createRouter({
	history: createWebHashHistory(),
	routes,
});

export default router;
