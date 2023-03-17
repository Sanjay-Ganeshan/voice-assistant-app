import React, { Component } from "react";
import axios from "axios";
import styles from "./MainPage.module.css";

type Props = {};

type State = {
    isRecording: boolean;
    apiKey: string;
    mediaRecorder: MediaRecorder | null;
};

const SESSION_STORAGE_KEY = "OPENAI_API_KEY";

export default class MainPage extends Component<Props, State> {
    state: State = {
        isRecording: false,
        mediaRecorder: null,
        apiKey: sessionStorage.getItem(SESSION_STORAGE_KEY) ?? "",
    };

    sendAudioToApi = async (audioBlob: Blob) => {
        const formData = new FormData();
        formData.append("file", audioBlob, "audio.webm");
        formData.append("model", "whisper-1");

        try {
            const response = await axios.post(
                "https://api.openai.com/v1/audio/transcriptions",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Authorization: `Bearer ${this.state.apiKey}`,
                    },
                }
            );

            console.log(response.data);
            const transcriptionData = response.data;
            const transcription = transcriptionData.text;

            const chatResponse = await axios.post(
                "https://api.openai.com/v1/chat/completions",
                {
                    model: "gpt-3.5-turbo",
                    messages: [
                        {
                            role: "system",
                            content: "You are a helpful assistant.",
                        },
                        { role: "user", content: "Answer the following question in just a few sentences."},
                        { role: "user", content: transcription },
                    ],
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.state.apiKey}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            // Log the completed chat
            const chatText = chatResponse.data.choices[0].message.content;
            const utterance = new SpeechSynthesisUtterance(chatText);
            speechSynthesis.speak(utterance);
        } catch (error) {
            console.error("Error sending audio to API:", error);
        }
    };

    toggleRecording = async () => {
        const { isRecording, mediaRecorder } = this.state;

        if (!isRecording) {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            const newMediaRecorder = new MediaRecorder(stream);
            newMediaRecorder.start();

            newMediaRecorder.ondataavailable = async (e) => {
                await this.sendAudioToApi(e.data);
            };

            this.setState({
                mediaRecorder: newMediaRecorder,
                isRecording: true,
            });
        } else {
            if (mediaRecorder) {
                mediaRecorder.stop();
                this.setState({ mediaRecorder: null, isRecording: false });
            }
        }
    };

    saveToken(ev: React.FocusEvent<HTMLInputElement>) {
        if (this.state.apiKey !== null) {
            sessionStorage.setItem(
                SESSION_STORAGE_KEY, this.state.apiKey
            );
        }
    }

    textChanged(ev: React.ChangeEvent<HTMLInputElement>) {
        this.setState({
            apiKey: ev.target.value
        });
    }

    render() {
        const { isRecording } = this.state;
        
        return (
            <div className={styles.container}>
                <p>OpenAI Key Here</p>
                <input type="password" onChange={this.textChanged.bind(this)} onBlur={this.saveToken.bind(this)} value={this.state.apiKey}></input>
                <button
                    className={styles.recordButton}
                    onClick={this.toggleRecording}
                >
                    {isRecording ? "Stop" : "Record"}
                </button>
            </div>
        );
    }
}
