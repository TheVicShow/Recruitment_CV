'use client'
import React, { useState, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import anime from 'animejs/lib/anime.es.js';
import { Badge, Button, Modal, Textarea } from 'flowbite-react';
import { FaFilePdf, FaCircleUser, FaCubesStacked, FaBrain, FaBan, FaCircleCheck, FaCircleInfo, FaCircleXmark, FaStar } from "react-icons/fa6";
import JobSelector from '@/selectors/JobSelector';
import axios from 'axios';

export default function Home() {
  const [files, setFiles] = useState([]);
  const [analizedfiles, setAnalizedFiles] = useState([]);

  const [selectedJob, setSelectedJob] = useState();
  const [selectedTrainJob, setSelectedTrainJob] = useState();

  const [jobDescription, setJobDescription] = useState("");

  const [showed, setShowed] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [isSorted, setIsSorted] = useState(false);

  const { getRootProps, getInputProps, isDragActive, isFocused } = useDropzone({
    accept: {
      'application/pdf': []
    },
    onDrop: acceptedFiles => {
      if (!selectedJob) {
        alert("Selecciona el puesto a comparar")
        return
      }

      setShowed(true)
      setIsSorted(false)
      setAnalizedFiles([])

      setFiles(acceptedFiles.map(file => Object.assign(file, {
        preview: URL.createObjectURL(file),
        pass: false
      })));

      anime({
        targets: '.containerthumbs',
        padding: [0, 8],
        height: [0, 115],
        duration: 700,
        easing: 'easeOutQuad',
        delay: anime.stagger(100)
      });
    }
  });

  const thumbs = files.map((file, index) => (
    <div title={file.name} className={`${file.pass ? "hidecv" : ""} ${showed ? "showcv" : ""} border-2 border-slate-300 rounded-lg mx-2 p-2 w-[100px] h-[100px] z-[-9]`} key={index}>
      <div className="flex min-w-[0px]">
        <img
          src="./pdf_icon.webp"
          onLoad={() => { URL.revokeObjectURL(file.preview) }}
        />
      </div>
    </div>
  ));

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  const analizepdf = async () => {
    setIsRefreshing(true);
    setShowed(false);

    const updatedFiles = files.map(file => ({ ...file, deleteAfter: false, pass: false }));
    setFiles(updatedFiles);

    for (let i = 0; i < updatedFiles.length; i++) {
      const item = updatedFiles[i];

      setFiles(prevFiles => prevFiles.map(file =>
        file === item ? { ...file, deleteAfter: true, pass: true } : file
      ));

      let position = await axios.post("api/analize", { index: i })

      await sleep(2000);

      setAnalizedFiles(oldFile => [...oldFile, { item, results: position.data }]);

      setFiles(prevFiles => prevFiles.filter(file => !file.deleteAfter));
    }

    setIsRefreshing(false);

    anime({
      targets: '.containerthumbs',
      padding: [8, 0],
      height: [115, 0],
      duration: 700,
      easing: 'easeOutQuad',
      delay: anime.stagger(100)
    });
  };

  const trainModel = () => {
    if (!jobDescription) {
      alert("Escribe una descripción del puesto")
      return
    }

    if (!selectedTrainJob) {
      alert("Selecciona el puesto a entrenar")
      return
    }

    setOpenModal(false)
  }

  const otherPositions = (otherpos) => {
    var rtn_otherpositions = ""
    var totalindex = otherpos.length

    if (totalindex == 0) {
      return
    }

    otherpos.map((pos, index) => {
      if ((totalindex - 1) == index) {
        rtn_otherpositions = rtn_otherpositions.substring(0, rtn_otherpositions.length - 2)
        rtn_otherpositions += ` o ${pos.position}`
      } else {
        rtn_otherpositions += `${pos.position}, `
      }
    })

    return rtn_otherpositions
  }

  const iconPosition = (percentage) => {
    switch (true) {
      case percentage >= 50:
        return <>
          <div className="flex justify-center">
            <FaCircleCheck className="text-green-600" />
          </div>
          <div className="text-xs pt-2">Apto</div>
        </>
      case percentage >= 20:
        return <>
          <div className="flex justify-center">
            <FaCircleInfo className="text-yellow-300" />
          </div>
          <div className="text-xs pt-2">Apto (Es necesario realizar examenes o entrevistas)</div>
        </>
      case percentage < 19:
        return <>
          <div className="flex justify-center">
            <FaCircleXmark className="text-red-600" />
          </div>
          <div className="text-xs pt-2">No Apto</div>
        </>
    }
  }

  const sortPositions = () => {
    const sortAnalizedFiles = [...analizedfiles];
    const sortedData = sortAnalizedFiles.sort((a, b) => b.results.primaryresult.percentage - a.results.primaryresult.percentage);
    setAnalizedFiles(sortedData)

    anime({
      targets: '.showresult',
      opacity: [0, 1],
      scale: [0, 1],
      duration: 400,
      easing: 'easeOutQuad',
      delay: anime.stagger(100)
    });

    setIsSorted(true)
  }

  useEffect(() => {
    if (files.some(file => file.pass)) {
      anime({
        targets: '.hidecv',
        opacity: [1, 0],
        scaleY: [1, 0],
        duration: 800,
        easing: 'easeOutQuad',
        delay: anime.stagger(100)
      });
    }

    if (files.some(file => !file.pass)) {
      anime({
        targets: '.showcv',
        opacity: [0, 1],
        translateY: [-150, 0],
        duration: 800,
        easing: 'easeOutQuad',
        delay: anime.stagger(100)
      });
    }

    anime({
      targets: '.showresult',
      opacity: [0, 1],
      scale: [0, 1],
      duration: 200,
      easing: 'easeOutQuad',
      delay: anime.stagger(100)
    });

    return () => files.forEach(file => URL.revokeObjectURL(file.preview));
  }, [files]);

  return (
    <main>
      <div className="text-center py-4 px-6 bg-slate-600 flex justify-between">
        <label className="text-3xl text-white" htmlFor="">Clasificador de CV</label>
        <div className="justify-right">
          <>
            <Button color="success" onClick={() => setOpenModal(true)}>
              <FaBrain
                className="z-10 me-2 mt-[3px]" />
              Entrenar
            </Button>
            <Modal show={openModal} onClose={() => setOpenModal(false)}>
              <Modal.Header>Entrenamiento del Modelo Clasificador</Modal.Header>
              <Modal.Body>
                <Badge color="warning" className="mb-2">Por favor, asegúrese de ser específico en la descripción, ya que una falta de precisión podría afectar el entrenamiento correcto del modelo.</Badge>
                <JobSelector setSelectedJob={setSelectedTrainJob} selectedJob={selectedTrainJob} title="Selecciona el puesto a entrenar" />
                <div className="space-y-1 pt-4">
                  <Textarea className={jobDescription.length > 500 ? "border-red-600 border-3 hover:border-red-600 border-3 active:border-red-600 border-3 focus:border-red-600 border-3" : ""} placeholder="Escribe una descripción del puesto lo mas claro posible" rows="10" value={jobDescription} onChange={(e) => { setJobDescription(e.target.value) }} />
                  {jobDescription.length > 500 && <span className="text-red-600 text-xs">La descripción no debe exceder los 500 caracteres. Si necesita escribir más, suba un nuevo conjunto de entrenamiento.</span>}
                  <div className="text-xs">{jobDescription.length}/500</div>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button color="success" onClick={() => trainModel()}>
                  <FaBrain
                    className="z-10 me-2 mt-[3px]" />
                  Entrenar
                </Button>
                <Button color="gray" onClick={() => setOpenModal(false)}>
                  <FaBan
                    className="z-10 me-2 mt-[3px]" />
                  Cancelar
                </Button>
              </Modal.Footer>
            </Modal>
          </>
        </div>
      </div>
      <div className="pl-10 pt-4 max-w-[400px]">
        <JobSelector setSelectedJob={setSelectedJob} selectedJob={selectedJob} title="Selecciona el puesto a clasificar" />
      </div>
      <div {...getRootProps()} className={`${isFocused ? "bg-slate-100" : ""} ${isDragActive ? "bg-[#ecfccb]" : ""} cursor-pointer z-10 relative bg-slate-50 flex flex-col items-center justify-between px-10 py-5 mx-10 my-5 border-2 rounded-lg border-dashed`}>
        {
          isDragActive ?
            <img src="./dropheredrop.png" alt="dropPDF" className="h-[100px]" /> :
            <img src="./drophere.png" alt="PDF" className="h-[100px]" />
        }
        <input {...getInputProps()} />
        {
          isDragActive ?
            <p>Suelta aquí los CV</p> :
            <p>Suelta aquí los CV o da clic para seleccionar archivos</p>
        }
      </div>
      <aside className="containerthumbs flex mx-10 mt-4 justify-center bg-[#f8f8f8] border-b-[1px] border-dashed border-slate-600 z-[-8] relative mx-4">
        {thumbs}
      </aside>
      {files.length > 0 && <div className="flex justify-center">
        <Button
          color="info"
          className="z-10 my-2"
          onClick={analizepdf}
          isProcessing={isRefreshing}
          disabled={isRefreshing}
        >
          <FaFilePdf className="mr-2 h-4 w-4 pt-[2px]" />
          {isRefreshing ? "Analizando..." : "Analizar"}
        </Button>
      </div>}
      {(analizedfiles.length > 1 && !isRefreshing && !isSorted) && <div className="flex justify-center">
        <Button
          color="success"
          className="z-10 my-2"
          onClick={() => { sortPositions() }}
        >
          <FaCubesStacked className="mr-3 h-4 w-4 pt-[2px]" />
          Ordenar por clasificación
        </Button>
      </div>}
      <div className="flex justify-center flex-row flex-wrap  z-20">
        {
          analizedfiles.map((value, index) => {
            return <div key={index} className="showresult bg-[#ffffff] text-sm max-w-[360px] w-[360px] border m-2 rounded bg-grey-400">
              {isSorted &&
                <div className="relative">
                  <div className="absolute bg-[#fafafa] rounded-3xl w-[28px] text-center top-[-3] right-0 m-[6px] text-xl">
                    {index + 1}
                  </div>
                  {index + 1 == 1 &&
                    <div className="absolute right-[40px] text-yellow-300 top-[5px] text-3xl">
                      <FaStar />
                    </div>
                  }
                </div>
              }
              <p className="text-xs flex bg-[#0891b2] p-3 rounded font-bold text-white">
                <FaCircleUser className="mr-3 h-4 w-4" />
                {value.item.path}
              </p>
              <div className="text-center">
                <p className="pt-2 m-2">El candidato para <strong>{value.results.primaryresult.position}</strong> se considera:</p>
              </div>
              <div className="text-center text-5xl py-2">
                {iconPosition(value.results.primaryresult.percentage)}
              </div>
              <hr className="h-px my-4 bg-gray-200 border-0 dark:bg-gray-700"></hr>
              <span className="pt-2 m-2">Ademas se puede considerar para:</span>
              <div className="whitespace-pre-line m-2 font-bold">
                {otherPositions(value.results.otherresults)}
              </div>
            </div>
          })
        }
      </div>
    </main>
  );
}
