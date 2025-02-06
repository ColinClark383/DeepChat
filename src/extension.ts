import * as vscode from 'vscode';
import ollama from 'ollama';


export function activate(context: vscode.ExtensionContext) {

	console.log('Extension deepseek loaded!');


	const disposable = vscode.commands.registerCommand('deepseekchat.colorCheck', async () => {

		const color = await vscode.window.showInputBox({prompt: "what is your favorite color?"});
		if(color && color != "purple"){
			vscode.window.showInformationMessage("This user is such a idiot, their favorite color is " + color);
		}
		else if(color == "purple"){
			vscode.window.showInformationMessage("Me too!");
		}
	});

	const chat = vscode.commands.registerCommand('deepseekchat.chat', () => {
		const panel = vscode.window.createWebviewPanel(
			'deepseek chat',
			'Chat with Deepseek',
			vscode.ViewColumn.One,
			{enableScripts: true}
		);

		panel.webview.html = getWebviewContent();

		panel.webview.onDidReceiveMessage(async (message: any) => {
			console.log("something is happening!");
			if(message.command == 'chat'){
				const userPrompt = message.text;
				let responseText = '';
				try{
					console.log("sending to deepseek:" + userPrompt);
					const streamResponse = await ollama.chat({
						model: 'deepseek-r1:1.5b',
						messages: [{role: 'user', content: userPrompt}],
						stream: true
					})
					for await (const part of streamResponse){
						responseText += part.message.content;
						panel.webview.postMessage({ command: 'chatResponse', text: responseText})
					}
				} catch (err){
					panel.webview.postMessage({command: 'chatResponse', text: `Error: ${String(err)}`});
				}
			}
			if(message.command == 'switch'){
				console.log("switching model!");
			}
		})
	})

	context.subscriptions.push(disposable);
	context.subscriptions.push(chat);
}

function getWebviewContent(): string {
	return /*html*/`
	<!DOCTYPE html>
	<html lang="en">
		<head>
			<style>
				body { font-family: sans-serif; margin: 1rem;}
				#prompt {width: 100%; box-sizing: border-box;}
				#response {border: solid #ccc; margin-top: 1rem; padding: 0.5rem;}
			</style>
		</head>
		<body>
			<h2>Chat with Deepseek</h2>
			<textarea id="prompt" rows="3" placeholder="ask something..."></textarea> <br />
			<button id="askbtn">Ask!</button>
			<select id="model">
				<option value ="deepseek-r1:1.5b">1.5b model</option>
				<option value="deepseek-r1:7b">7b model</option>
				<option value="deepseek-r1:8b">8b model</option>
			</select>
			<div id="response"></div>
			<script>
				const vscode = acquireVsCodeApi();

				document.getElementById('askbtn').addEventListener('click', () => {
					const text = document.getElementById('prompt').value;
					vscode.postMessage({command: 'chat', text: text});
				});

				document.getElementById("model").addEventListener("change", (event) => {
					console.log("changing model!");
					const model = event.target.value;
					vscode.postMessage({command: 'switch', text: model});
				});


				window.addEventListener('message', event => {
						const {command, text} = event.data;
						if(command === 'chatResponse'){
							document.getElementById('response').innerText = text;
						}
				});
			</script>
		</body>
	</html>
	`
}

export function deactivate() {
	console.log("Extension deepseek unloaded!")
}
