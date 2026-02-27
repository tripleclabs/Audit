<script lang="ts">
	import { basicSetup } from 'codemirror';
	import { Compartment, EditorState } from '@codemirror/state';
	import { EditorView } from '@codemirror/view';
	import { javascript } from '@codemirror/lang-javascript';
	import { json } from '@codemirror/lang-json';
	import { html } from '@codemirror/lang-html';
	import { css } from '@codemirror/lang-css';
	import { markdown } from '@codemirror/lang-markdown';
	import { oneDark } from '@codemirror/theme-one-dark';
	import { onMount } from 'svelte';

	let { content = '', filePath = '', dark = true }: { content?: string; filePath?: string; dark?: boolean } = $props();

	let container: HTMLDivElement;
	let editorView: EditorView | null = $state(null);
	const languageCompartment = new Compartment();
	const themeCompartment = new Compartment();

	const detectLanguage = (path: string) => {
		if (path.endsWith('.ts')) return javascript({ typescript: true });
		if (path.endsWith('.js')) return javascript();
		if (path.endsWith('.json')) return json();
		if (path.endsWith('.html') || path.endsWith('.svelte')) return html();
		if (path.endsWith('.css')) return css();
		if (path.endsWith('.md')) return markdown();
		return [];
	};

	onMount(() => {
		editorView = new EditorView({
			state: EditorState.create({
				doc: content,
				extensions: [
					basicSetup,
					themeCompartment.of(dark ? oneDark : []),
					EditorView.editable.of(false),
					EditorState.readOnly.of(true),
					languageCompartment.of(detectLanguage(filePath)),
					EditorView.domEventHandlers({
						copy: (e) => e.preventDefault(),
						cut: (e) => e.preventDefault()
					}),
					EditorView.contentAttributes.of({ class: 'select-none' })
				]
			}),
			parent: container
		});

		return () => editorView?.destroy();
	});

	$effect(() => {
		if (editorView) {
			editorView.dispatch({
				changes: { from: 0, to: editorView.state.doc.length, insert: content },
				effects: languageCompartment.reconfigure(detectLanguage(filePath))
			});
		}
	});

	$effect(() => {
		if (editorView) {
			editorView.dispatch({
				effects: themeCompartment.reconfigure(dark ? oneDark : [])
			});
		}
	});
</script>

<div bind:this={container} class="h-full min-h-[600px] overflow-hidden rounded border {dark ? 'border-slate-700' : 'border-border'}"></div>
