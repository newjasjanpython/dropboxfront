import React, { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import {
  getStorage,
  ref,
  listAll,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  getMetadata,
} from "firebase/storage";
import Navbar from "../components/Navbar";
import "firebase/auth";
import "firebase/storage";

const Home = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [userFiles, setUserFiles] = useState([]);

  useEffect(() => {
    // Retrieve the user's files on component mount
    retrieveUserFiles();
  }, []);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = () => {
    if (selectedFile) {
      const storage = getStorage();
      const storageRef = ref(storage, "Files/" + selectedFile.name);
      const uploadTask = uploadBytesResumable(storageRef, selectedFile);

      uploadTask.on(
        "state_changed",
        null,
        (error) => {
          console.error("Error uploading file: ", error);
        },
        () => {
          console.log("File uploaded successfully!");
          retrieveUserFiles(); // Refresh the file list after successful upload
        }
      );
      retrieveUserFiles();
    } else {
      console.warn("No file selected!");
    }
  };

  const retrieveUserFiles = () => {
    // Retrieve the user's ID
    const user = getAuth().currentUser;
    if (user) {
      // Access the Files folder in Firebase for the logged-in user
      const storage = getStorage();
      const filesRef = ref(storage, "Files");

      listAll(filesRef)
        .then((res) => {
          const promises = res.items.map((item) =>
            getDownloadURL(item).then((url) => ({
              name: item.name,
              url: url,
            }))
          );
          return Promise.all(promises);
        })
        .then((fileData) => {
          setUserFiles(fileData);
        })
        .catch((error) => {
          console.error("Error retrieving user files: ", error);
        });
    }
  };

  const openFile = (url) => {
    window.open(url, "_blank");
  };

  const deleteFile = (fileName) => {
    const storage = getStorage();
    const fileRef = ref(storage, "Files/" + fileName);

    getMetadata(fileRef)
      .then(() => {
        // File exists, proceed with deletion
        deleteObject(fileRef)
          .then(() => {
            console.log("File deleted successfully!");
            retrieveUserFiles(); // Refresh the file list after successful deletion
          })
          .catch((error) => {
            console.error("Error deleting file: ", error);
          });
      })
      .catch((error) => {
        // File does not exist
        console.error("File does not exist: ", error);
      });
  };

  return (
    <div className="body">
      <Navbar />

      <div className="">
        <h1 className="text-center text-white mt-4"><b>Your Files</b></h1>

        <div className="d-flex justify-content-center">
          {userFiles.length === 0 ? (
            <h1 className="text-center text-dark mt-4">No File</h1>
          ) : (
            userFiles.map((file, index) => (
              <div className="m-4" key={index}>
                <p className="card" style={{ width: "130px" }}>
                  <img
                    onClick={() => openFile(file.url)}
                    width={100}
                    height={50}
                    className=""
                    style={{ width: "128px", height: "130px" }}
                    src="https://pixy.org/src/452/thumbs350/4522322.jpg"
                    alt=""
                  />{" "}
                  <br />
                  <p
                    className=""
                    style={{
                      width: "110px",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                      textAlign: "center",
                    }}
                  >
                    {file.name}
                  </p>
                  <button
                    className="btn btn-danger"
                    onClick={() => deleteFile(file.name)}
                  >
                    Delete
                  </button>
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <div
        className="modal fade"
        id="exampleModal"
        tabIndex="-1"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="exampleModalLabel">
                File Upload
              </h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <div className="">
                <input type="file" onChange={handleFileChange} />
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Close
              </button>
              <button
                width={"100px"}
                className="btn btn-success"
                onClick={handleUpload}
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
