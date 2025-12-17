import React from 'react'
import './Chatting.css'
import Modal from "react-bootstrap/Modal";

import { GiPlainCircle } from "react-icons/gi";

import { IoClose } from "react-icons/io5";
import img from '../../Image2/img37.jpeg'
import { FaPaperclip } from "react-icons/fa6";
import { FaRegFile } from "react-icons/fa";
import { IoCameraOutline } from "react-icons/io5";
import { TiMicrophoneOutline } from "react-icons/ti";



export function Chatting(props) {
    return (
        <Modal
            {...props}
            size="sl"
            aria-labelledby="contained-modal-title-vcenter"
            centered
        >
            <Modal.Body className='chatting'>
                <div className='chatting1'>
                    <div className='chatting2'>
                        <div className='chatting3'>
                            <div className='chatting4'>
                                <div className='chatting5'>
                                    <img src={img} alt="" />
                                </div>
                                <div className='chatting6'>
                                    <h6>John Abraham</h6>
                                    <p><GiPlainCircle color='#00F076' size={15} /> Online</p>
                                </div>
                            </div>
                            <div className='chatting7'>
                                <IoClose color='#0F2A44' size={35}  onClick={props.onHide} />
                            </div>
                        </div>
                        <div className='chatting8'>
                            <div className='chatting9'>
                                <p>Today</p>
                            </div>
                            <div className='chatting10'>
                                <div className='chatting11'>
                                    <div className='chatting12'>
                                        <p>Hello! John Abraham</p>
                                    </div>
                                    <div className='chatting13'>
                                        <p>09:25 AM</p>
                                    </div>
                                </div>
                                <div className='chatting14'>
                                    <div className='chatting15'>
                                        <p>Hello! Joy Roy</p>
                                    </div>
                                    <div className='chatting16'>
                                        <p>09:25 AM</p>
                                    </div>
                                </div>
                                <div className='chatting11'>
                                    <div className='chatting12'>
                                        <p>Hello! John Abraham</p>
                                    </div>
                                    <div className='chatting13'>
                                        <p>09:25 AM</p>
                                    </div>
                                </div>
                                <div className='chatting14'>
                                    <div className='chatting15'>
                                        <p>Hello! Joy Roy</p>
                                    </div>
                                    <div className='chatting16'>
                                        <p>09:25 AM</p>
                                    </div>
                                </div>
                                <div className='chatting11'>
                                    <div className='chatting12'>
                                        <p>Hello! John Abraham</p>
                                    </div>
                                    <div className='chatting13'>
                                        <p>09:25 AM</p>
                                    </div>
                                </div>
                                <div className='chatting14'>
                                    <div className='chatting15'>
                                        <p>Hello! Joy Roy</p>
                                    </div>
                                    <div className='chatting16'>
                                        <p>09:25 AM</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className='chatting17'>
                            <div className='chatting18'>
                                <FaPaperclip color='#282828' size={20}/>
                            </div>
                            <div className='chatting19'>
                                <input type="text" placeholder='Write a Message' />
                                <FaRegFile color='#636363' />
                            </div>
                            <div className='chatting20'>
                                <IoCameraOutline color='#282828' size={20}/>
                                <TiMicrophoneOutline color='#282828' size={20}/>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal.Body>
        </Modal>
    );
}
