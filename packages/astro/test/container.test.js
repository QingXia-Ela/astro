import { describe, it } from 'node:test';
import {
	Fragment,
	createComponent,
	maybeRenderHead,
	render,
	renderComponent,
	renderHead,
	renderSlot,
	createAstro,
	renderScript
} from '../dist/runtime/server/index.js';
import { unstable_AstroContainer } from '../dist/container/index.js';
import assert from 'node:assert/strict';

const createAstroModule = (AstroComponent) => ({ default: AstroComponent });

const BaseLayout = createComponent((result, _props, slots) => {
	return render`<html>
	<head>
	${renderSlot(result, slots['head'])}
	${renderHead(result)}
	</head>
	${maybeRenderHead(result)}
	<body>
		${renderSlot(result, slots['default'])}
	</body>
</html>`;
});

describe.only('Container', () => {
	it('Renders a div with hello world text', async () => {
		const Page = createComponent((result) => {
			return render`${renderComponent(
				result,
				'BaseLayout',
				BaseLayout,
				{},
				{
					default: () => render`${maybeRenderHead(result)}<div>hello world</div>`,
					head: () => render`
						${renderComponent(
							result,
							'Fragment',
							Fragment,
							{ slot: 'head' },
							{
								default: () => render`<meta charset="utf-8">`,
							}
						)}
					`,
				}
			)}`;
		});

		const container = await unstable_AstroContainer.create();
		const PageModule = createAstroModule(Page);
		const response = await container.renderToString(PageModule);

		assert.match(response, /hello world/);
	});

	it('Renders a redirect by using the Astro global', async () => {
		const $Astro = createAstro();
		const Page = createComponent(
			(result, props, slots) => {
				const Astro = result.createAstro($Astro, props, slots);
				return Astro.redirect('/something');
			},
			'Component.astro',
			undefined
		);

		const Page2 = createComponent(
			(result) => {
				return render`${renderComponent(
					result,
					'BaseLayout',
					BaseLayout,
					{},
					{
						default: () => render`${maybeRenderHead(result)}<div>Something!</div>`,
						head: () => render`
						${renderComponent(
							result,
							'Fragment',
							Fragment,
							{ slot: 'head' },
							{
								default: () => render`<meta charset="utf-8">`,
							}
						)}
					`,
					}
				)}`;
			},
			'Component2.astro',
			undefined
		);

		const container = await unstable_AstroContainer.create();
		container.insertRoute({
			path: '/something',
			component: createAstroModule(Page2),
		});
		const PageModule = createAstroModule(Page);
		const response = await container.renderToResponse(PageModule);

		assert.equal(response.status, 302);
	});

	it('Renders a slot', async () => {
		const Page = createComponent(
			(result, _props, slots) => {
				return render`${renderComponent(
					result,
					'BaseLayout',
					BaseLayout,
					{},
					{
						default: () => render`
							${maybeRenderHead(result)}
							${renderSlot(result, slots['default'])}
							`,
						head: () => render`
						${renderComponent(
							result,
							'Fragment',
							Fragment,
							{ slot: 'head' },
							{
								default: () => render`<meta charset="utf-8">`,
							}
						)}
					`,
					}
				)}`;
			},
			'Component2.astro',
			undefined
		);

		const container = await unstable_AstroContainer.create();
		const PageModule = createAstroModule(Page);
		const result = await container.renderToString(PageModule, {
			slots: {
				default: 'some slot',
			},
		});

		assert.match(result, /some slot/);
	});

	it('Renders multiple named slots', async () => {
		const Page = createComponent(
			(result, _props, slots) => {
				return render`${renderComponent(
					result,
					'BaseLayout',
					BaseLayout,
					{},
					{
						default: () => render`
							${maybeRenderHead(result)}
							${renderSlot(result, slots['custom-name'])}
							${renderSlot(result, slots['foo-name'])}
							`,
						head: () => render`
						${renderComponent(
							result,
							'Fragment',
							Fragment,
							{ slot: 'head' },
							{
								default: () => render`<meta charset="utf-8">`,
							}
						)}
					`,
					}
				)}`;
			},
			'Component2.astro',
			undefined
		);

		const container = await unstable_AstroContainer.create();
		const PageModule = createAstroModule(Page);
		const result = await container.renderToString(PageModule, {
			slots: {
				'custom-name': 'Custom name',
				'foo-name': 'Bar name',
			},
		});

		assert.match(result, /Custom name/);
		assert.match(result, /Bar name/);
	});
	
	it.only('Renders a script', async () => {
		const Page = createComponent(
			(result, _props, _slots) => {
				return render`${renderComponent(
					result,
					'BaseLayout',
					BaseLayout,
					{},
					{
						default: () => render`
							${maybeRenderHead(result)}
							${renderScript(result,"Page.astro?astro&type=script&index=0&lang.ts")}
							`,
						head: () => render`
						${renderComponent(
							result,
							'Fragment',
							Fragment,
							{ slot: 'head' },
							{
								default: () => render`<meta charset="utf-8">`,
							}
						)}
					`,
					}
				)}`;
			},
			'Component2.astro',
			undefined
		);

		const container = await unstable_AstroContainer.create();
		const PageModule = createAstroModule(Page);
		const result = await container.renderToString(PageModule, {
			scripts: [
				{
					type: 'inline' ,
					value: "console.log()"
				}
			]
		});

		console.log(result)

		// assert.match(result, /Custom name/);
		// assert.match(result, /Bar name/);
	});
});
