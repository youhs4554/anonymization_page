import "@fortawesome/fontawesome-free/css/all.min.css";
import "bootstrap-css-only/css/bootstrap.min.css";
import "mdbreact/dist/css/mdb.css";
import React, { Component } from "react";
import logo from "./logo.svg";
import "./App.css";
import axios from "axios";
import ProgressBar from "react-customizable-progressbar";
import PulseLoader from "react-spinners/PulseLoader";

class App extends Component {
  state = {
    selectedFile: null,
    uploadProgress: null,
    anonyProgress: null,
    uploadCompleteMsg: null,
    anonyCompleteMsg: null,
    unzip: null,
    compress: null,
    uploadDone: null,
    annDone: null,
    eventId: null,
  };
  componentDidMount() {
    const that = this;

    var N = 10; // for identification of redis event
    var eventId = (Math.random().toString(36) + "00000000000000000").slice(
      2,
      N + 2
    );

    that.setState({
      eventId: eventId,
    });

    const es = new EventSource("http://125.190.142.88:9999/api/v1.0/stream");
    es.addEventListener(
      eventId,
      function (e) {
        // 'myevent' 이벤트의 데이터 처리
        var data = JSON.parse(e.data);
        var p = Math.round(data.percent);
        // console.log("data.unzip", data);
        if (data.elpased_time) {
          var tm = data.elpased_time + "/" + data.estimated_time;
          that.setState({
            anonyCompleteMsg: (
              <p
                style={{
                  color: "white",
                  fontSize: "18px",
                }}
              >
                {tm}
              </p>
            ),
          });
          console.log(that.state.anonyCompleteMsg);
        }
        if (data.unzip) {
          that.setState({
            // un-toggle upload spinner an
            unzip: false,
            uploadCompleteMsg: (
              <h4
                style={{
                  color: "#C1F70B",
                  fontFamily: "Piedra",
                  fontSize: "25px",
                }}
              >
                <u>Done!</u>
              </h4>
            ),
            uploadDone: true,
          });
        }
        if (data.compress) {
          that.setState({
            compress: false,
            anonyCompleteMsg: (
              <h4
                style={{
                  color: "#C1F70B",
                  fontFamily: "Piedra",
                  fontSize: "25px",
                }}
              >
                <u>Done!</u>
              </h4>
            ),
            annDone: true,
          });
        }

        if (that.state.annDone) {
          // download resulting files
          data.fileList.forEach((element) => {
            window.open(
              "http://125.190.142.88:9999/api/v1.0/download/" + element
            );
          });
        }

        if (p === 100) {
          that.setState({
            // toggle spinner to show compress progress
            compress: true,
            anonyCompleteMsg: "",
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
      uploadDone: null,
      annDone: null,
    });

    var fileList = event.target.files;
    if (fileList.length === 0) {
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
    this.setState({
      uploadProgress: null,
      anonyProgress: null,
      uploadCompleteMsg: null,
      anonyCompleteMsg: null,
      uploadDone: null,
      annDone: null,
    });
    console.log("##############ID################", this.state.eventId);
    console.log(
      document.getElementsByClassName("form-control")[0].files.length
    );
    if (document.getElementsByClassName("form-control")[0].files.length === 0) {
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

    data.append("eventId", this.state.eventId);

    console.log(this.state.selectedFile[0]);

    axios
      .post("http://125.190.142.88:9999/api/v1.0/anonymization", data, {
        onUploadProgress: (progressEvent) => {
          var e = document.getElementById("flash-container");
          e.textContent = "";

          var p = Math.round(
            (progressEvent.loaded / progressEvent.total) * 100
          );

          if (p === 100) {
            this.setState({
              // toggle spinner to show unzip progress
              unzip: true,
            });
          }

          console.log("upload", p);
          this.setState({
            uploadProgress: p,
          });
        },
      })
      .then((response) => {
        console.log("########################", response);
      })
      .catch((error) => {
        // error handling
        // alert("server is not responding....");
        console.log(error);
        var e = document.getElementById("flash-container");
        e.textContent =
          "Bad Request : This software supports '.dcm' file extention only!";
        e.style.color = "red";
        e.style.fontWeight = "bold";
        this.setState({
          uploadProgress: null,
          anonyProgress: null,
          uploadCompleteMsg: null,
          anonyCompleteMsg: null,
          unzip: null,
          compress: null,
          uploadDone: null,
          annDone: null,
        });
      });
  };
  render() {
    return (
      <div
        className="App"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexDirection: "column",
          backgroundColor: "#272727",
          minHeight: "100vh",
          backgroundSize: "cover",
        }}
      >
        {/* tar, zip, 파일 업로드 허용!
          서버에서
          1) 압축 해제
          2) 익명화
          3) 재압축하고 다운로드 링크 제공*/}
        <span
          id="flash-container"
          style={{
            color: "black",
            backgroundColor: "#F8EFA8",
            width: "100%",
            fontSize: "30px",
          }}
        ></span>
        <h1
          style={{
            color: "white",
            fontSize: "50px",
            // fontWeight: "bold",
            fontFamily: "Piedra",
            textDecoration: "initial",
          }}
        >
          Dicom Anonymization App
        </h1>

        <img src={logo} className="App-logo" alt="logo" />

        <input
          style={{ width: "50%", height: "50%" }}
          type="file"
          className="form-control"
          onChange={this.fileSelectedHandler}
          ref={(fileInput) => (this.fileInput = fileInput)}
        />
        <button
          style={{
            color: "white",
            backgroundColor: "#00576B",
            borderColor: "#00576B",
            padding: "8px 8px",
            margin: "10px",
            width: "50%",
            fontSize: "2.0rem",
            fontWeight: "bold",
          }}
          onClick={this.fileUploadHandler}
          title="Upload & Run"
        >
          Upload & Run
        </button>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-around",
            width: "50%",
            marginBottom: "4rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexDirection: "column",
            }}
          >
            <h3
              style={{
                color: this.state.uploadDone ? "#C1F70B" : "#5d9cec",
                fontWeight: this.state.uploadDone ? "bold" : "normal",
                fontFamily: "Piedra",
                fontSize: "35px",
              }}
            >
              Upload
            </h3>
            <ProgressBar
              radius={100}
              progress={this.state.uploadProgress}
              strokeWidth={18}
              strokeColor={this.state.uploadDone ? "#C1F70B" : "#5d9cec"}
              strokeLinecap="square"
              trackStrokeWidth={18}
            >
              <PulseLoader
                size="15px"
                margin="8px"
                color={"#5d9cec"}
                loading={this.state.unzip}
              ></PulseLoader>
            </ProgressBar>

            {this.state.uploadCompleteMsg}
          </div>

          <div>
            <h3
              style={{
                color: this.state.annDone ? "#C1F70B" : "#C48D94",
                fontWeight: this.state.annDone ? "bold" : "normal",
                fontFamily: "Piedra",
                fontSize: "35px",
              }}
            >
              Anonymization
            </h3>
            <ProgressBar
              radius={100}
              progress={this.state.anonyProgress}
              strokeWidth={18}
              strokeColor={this.state.annDone ? "#C1F70B" : "#C48D94"}
              strokeLinecap="square"
              trackStrokeWidth={18}
            >
              <PulseLoader
                size="15px"
                margin="8px"
                color={"#C48D94"}
                loading={this.state.compress}
              />
              {this.state.anonyCompleteMsg}
            </ProgressBar>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
