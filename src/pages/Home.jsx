import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
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

const Home = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const path = queryParams.get("path");

  const [selectedFile, setSelectedFile] = useState(null);
  const [userFiles, setUserFiles] = useState([]);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    retrieveUserFiles(path);
  }, [path]);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = () => {
    if (selectedFile) {
      const storage = getStorage();
      const storageRef = ref(storage, `Files/${path || ""}` + selectedFile.name);
      const uploadTask = uploadBytesResumable(storageRef, selectedFile);

      uploadTask.on(
        "state_changed",
        null,
        (error) => {
          console.error("Error uploading file:", error);
        },
        () => {
          retrieveUserFiles(path);
        }
      );
    } else {
      console.warn("No file selected!");
    }
  };

  const retrieveUserFiles = (currentPath) => {
    const user = getAuth().currentUser;
    if (user) {
      const storage = getStorage();
      const filesRef = ref(storage, `Files/${currentPath || ""}`);

      listAll(filesRef)
        .then((res) => {
          const promises = res.items.map((item) =>
            getDownloadURL(item).then((url) => ({
              name: item.name,
              url: url,
              isFolder: false,
            }))
          );

          const folderPromises = res.prefixes.map((prefix) => ({
            name: prefix.name.split("/").pop(),
            isFolder: true,
          }));

          return Promise.all([...promises, ...folderPromises]);
        })
        .then((fileData) => {
          setUserFiles(fileData);
        })
        .catch((error) => {
          console.error("Error retrieving user files:", error);
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
        deleteObject(fileRef)
          .then(() => {
            retrieveUserFiles(path);
          })
          .catch((error) => {
            console.error("Error deleting file:", error);
          });
      })
      .catch((error) => {
        console.error("Error getting metadata:", error);
      });
  };

  const openFolder = (folderName) => {
    const newPath = path ? `${path}/${folderName}` : folderName;
    retrieveUserFiles(newPath);
  };

  const handleFolderNameChange = (event) => {
    setNewFolderName(event.target.value);
  };

  const createFolder = () => {
    const storage = getStorage();
    const folderName = newFolderName.trim();

    if (folderName) {
      const folderRef = ref(storage, `Files/${folderName}/`);
      
      // eslint-disable-next-line
      uploadBytesResumable(folderRef, new Uint8Array())
        .then(() => {
          retrieveUserFiles(path);
          setNewFolderName('');
        })
        .catch((error) => {
          console.error('Error creating folder:', error);
        });
    } else {
      console.warn('Please enter a valid folder name!');
    }
  };

  return (
    <div className="body">
      <Navbar />

      <div className="">
        <h1 className="text-center text-white mt-4">
          <b>Your Files and Folders</b>
        </h1>

        <div className="d-flex justify-content-center">
          {userFiles.length === 0 ? (
            <h1 className="text-center text-dark mt-4">No File or Folder</h1>
          ) : (
            userFiles.map((file, index) => (
              <div className="m-4" key={index}>
                <div className="card" style={{ width: "130px" }}>
                  {file.isFolder ? (
                    <div>
                      <img
                        width={100}
                        height={50}
                        style={{ width: "128px", height: "130px" }}
                        src="https://iconarchive.com/download/i107046/google/noto-emoji-animals-nature/22215-open-file-folder.ico"
                        alt=""
                        onClick={() => openFolder(file.name)}
                        style={{ cursor: 'pointer' }}
                      />
                      <p
                        style={{
                          width: "110px",
                          overflow: "hidden",
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                          textAlign: "center",
                        }}
                        onClick={() => openFolder(file.name)}
                        style={{ cursor: 'pointer' }}
                      >
                        {file.name}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <img
                        onClick={() => openFile(file.url)}
                        width={100}
                        height={50}
                        style={{ width: "128px", height: "130px" }}
                        src="https://pixy.org/src/452/thumbs350/4522322.jpg"
                        alt=""
                      />
                      <p
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
                    </div>
                  )}
                </div>
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
              {/* eslint-disable-next-line */}
              <button
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

      <div
        className="modal fade"
        id="newFolder"
        tabIndex="-1"
        aria-labelledby="newFolderLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="newFolderLabel">
                Create folder
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
                <input
                  type="text"
                  id="new_folder_name"
                  className="form-control w-100"
                  placeholder="Folder name"
                  value={newFolderName}
                  onChange={handleFolderNameChange}
                />
                {/* eslint-disable-next-line */}
                <button className="btn btn-primary mt-2" onClick={createFolder}>
                  Create folder
                </button>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
