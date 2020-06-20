import "@fortawesome/fontawesome-free/css/all.min.css";
import "bootstrap-css-only/css/bootstrap.min.css";
import "mdbreact/dist/css/mdb.css";
import React, { Component } from "react";
import logo from "./logo.svg";
import "./App.css";
import axios from "axios";
import ProgressBar from "react-customizable-progressbar";
import { FaUpload } from "react-icons/fa";
import styled from "styled-components";
import DatatablePage from "./DatatablePage";

class App extends Component {
  state = {
    selectedFile: null,
    uploadProgress: null,
    anonyProgress: null,
    uploadCompleteMsg: null,
    anonyCompleteMsg: null,
  };
  componentDidMount() {
    const that = this;

    const es = new EventSource("http://127.0.0.1:9999/api/v1.0/stream");
    es.addEventListener(
      "myevent",
      function (e) {
        // 'myevent' 이벤트의 데이터 처리
        var data = JSON.parse(e.data);
        var p = Math.round(data.percent);
        if (p == 100) {
          that.setState({
            anonyCompleteMsg: (
              <h4
                style={{
                  color: "#C48D94",
                  fontWeight: "bold",
                }}
              >
                <u>Done!</u>
              </h4>
            ),
            // toggle spinner to show zipping progress
            // ...
          });
        }
        if (!isNaN(p)) {
          console.log("server", p);
          that.setState({ anonyProgress: p });
        }
      },
      false
    );
  }
  fileSelectedHandler = (event) => {
    this.setState({
      uploadProgress: null,
      anonyProgress: null,
      uploadCompleteMsg: null,
      anonyCompleteMsg: null,
    });

    var fileList = event.target.files;
    if (fileList.length == 0) {
      return false;
    }

    console.log(fileList);
    this.setState({ selectedFile: fileList });
    var filename = fileList[0].name;
    var ext = filename.split(".").pop();
    var supported = ["zip", "tar", "tar.gz", "gz", "tgz"];

    if (!supported.includes(ext)) {
      alert(
        `Invalid extetion type of '${ext}'; supports file extetion among '[.zip, .tar, .tar.gz, .gz, .tgz]'`
      );
      this.setState({ selectedFile: null });
      event.target.value = null;
      return false;
    }
  };

  download = (filename) => {
    console.log(filename);
    var element = document.createElement("a");
    element.setAttribute("download", filename);

    element.style.display = "none";
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  };

  fileUploadHandler = () => {
    this.setState({ uploadCompleteMsg: null, tablePage: null });
    console.log(
      document.getElementsByClassName("form-control")[0].files.length
    );
    if (document.getElementsByClassName("form-control")[0].files.length == 0) {
      console.log("fall-out");
      return;
    }
    const data = new FormData();
    console.log(this.state.selectedFile);

    data.append(
      "file",
      this.state.selectedFile[0],
      this.state.selectedFile[0].name //todo. random string for user-identification
    );

    console.log(this.state.selectedFile[0]);

    axios
      .post("http://127.0.0.1:9999/api/v1.0/anonymization", data, {
        onUploadProgress: (progressEvent) => {
          var p = Math.round(
            (progressEvent.loaded / progressEvent.total) * 100
          );

          if (p == 100) {
            this.setState({
              uploadCompleteMsg: (
                <h4
                  style={{
                    color: "#5d9cec",
                    fontWeight: "bold",
                  }}
                >
                  <u>Done!</u>
                </h4>
              ),
              // toggle spinner to show unzip progress
              // ...
            });
          }

          console.log("upload", p);
          this.setState({
            uploadProgress: p,
          });
        },
      })
      .then((response) => {
        console.log(response.data);
        this.setState({
          uploadProgress: null,
          anonyProgress: null,
        });
        // TODO. will display download links
        // this.setState({ tablePage: <DatatablePage></DatatablePage> });
      })
      .catch((error) => {
        // error handling
        alert("server is not responding....");
        console.log(error);
      });
  };
  render() {
    const HoverBtn = styled.button`
      &:hover {
        background-color: orange;
        border-color: gold;
      }
    `;
    const items = [...Array(100)].map((val, i) => `Item ${i}`);

    return (
      <div
        className="App"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexDirection: "column",
          backgroundColor: "#272727",
        }}
      >
        {/* tar, zip, 파일 업로드 허용!
          서버에서
          1) 압축 해제
          2) 익명화
          3) 재압축하고 다운로드 링크 제공*/}
        <div>
          <img src={logo} className="App-logo" alt="logo" />
        </div>

        <input
          style={{ width: "50%" }}
          type="file"
          class="form-control"
          onChange={this.fileSelectedHandler}
          ref={(fileInput) => (this.fileInput = fileInput)}
        />
        <button
          style={{
            color: "white",
            backgroundColor: "#007bff",
            borderColor: "#007bff",
            padding: "8px 8px",
            margin: "10px",
            width: "50%",
            fontFamily: "inherit",
            fontSize: "1.0rem",
          }}
          onClick={this.fileUploadHandler}
          title="Upload & Run"
        >
          {/* <button
            onClick={this.download(
              "https://www.w3schools.com/images/myw3schoolsimage.jpg"
            )}
          >
            Click me
          </button> */}
          Upload & Run
        </button>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
          }}
        >
          <div
            style={{
              margin: "30px",
            }}
          >
            <h4
              style={{
                color: "white",
                fontWeight: "bold",
              }}
            >
              Upload
            </h4>
            <ProgressBar
              radius={100}
              progress={this.state.uploadProgress}
              strokeWidth={18}
              strokeColor="#5d9cec"
              strokeLinecap="square"
              trackStrokeWidth={18}
            >
              {this.state.uploadCompleteMsg}
            </ProgressBar>
          </div>

          <div
            style={{
              margin: "30px",
            }}
          >
            <h4
              style={{
                color: "white",
                fontWeight: "bold",
              }}
            >
              Anonymization
            </h4>
            <ProgressBar
              radius={100}
              progress={this.state.anonyProgress}
              strokeWidth={18}
              strokeColor="#C48D94"
              strokeLinecap="square"
              trackStrokeWidth={18}
            >
              {this.state.anonyCompleteMsg}
            </ProgressBar>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
