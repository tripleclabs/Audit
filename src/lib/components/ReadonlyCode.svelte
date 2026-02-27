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
	import { StreamLanguage } from '@codemirror/language';
	import { swift } from '@codemirror/legacy-modes/mode/swift';
	import { lua } from '@codemirror/legacy-modes/mode/lua';
	import { cpp } from '@codemirror/legacy-modes/mode/clike';
	import { onMount } from 'svelte';

	let { content = '', filePath = '', dark = true, line = 0 }: { content?: string; filePath?: string; dark?: boolean; line?: number } = $props();

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
		if (path.endsWith('.swift')) return StreamLanguage.define(swift);
		if (path.endsWith('.lua') || path.endsWith('.luau')) return StreamLanguage.define(lua);
		if (path.endsWith('.cpp') || path.endsWith('.cc') || path.endsWith('.cxx') || path.endsWith('.c') || path.endsWith('.h') || path.endsWith('.hpp')) return StreamLanguage.define(cpp);
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

			// Scroll to line after content update
			if (line > 0) {
				requestAnimationFrame(() => {
					if (!editorView) return;
					const lineInfo = editorView.state.doc.line(Math.min(line, editorView.state.doc.lines));
					editorView.dispatch({
						selection: { anchor: lineInfo.from },
						effects: EditorView.scrollIntoView(lineInfo.from, { y: 'center' })
					});
				});
			}
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

<div bind:this={container} class="h-full min-w-0 overflow-auto rounded border {dark ? 'border-slate-700' : 'border-border'}"></div>
