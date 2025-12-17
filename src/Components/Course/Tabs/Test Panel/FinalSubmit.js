import { Column, Pie } from "@ant-design/plots";
import {
    Card,
    Col,
    Divider,
    Layout,
    Modal,
    Progress,
    Row,
    Spin,
    Table,
    Tag,
    Typography,
    message,
    notification
} from "antd";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import React, { useEffect, useRef, useState } from "react";
import { GiCancel } from "react-icons/gi";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import akjLogo from "../../../../Image2/LOGO.jpeg";
import api from "../../../../api/axios";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const Scorecard = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const scorecardId = id;

    const [scorecard, setScorecard] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const scorecardRef = useRef(null);

    const location = useLocation();
    const { quizId, folderId } = location.state || {};

    // Prevent browser back button navigation
    useEffect(() => {
        const handleBackButton = (event) => {
            event.preventDefault();
            navigate("/explorecourses", { replace: true });
        };

        window.history.pushState(null, "", window.location.href);
        window.addEventListener("popstate", handleBackButton);

        return () => {
            window.removeEventListener("popstate", handleBackButton);
        };
    }, [navigate]);

    useEffect(() => {
        const fetchScorecardDetails = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/scorecards/${scorecardId}`);
                setScorecard(response.data.scorecard);
            } catch (error) {
                console.error("Error fetching scorecard details:", error);
                message.error("Failed to load scorecard details");
            } finally {
                setLoading(false);
            }
        };

        fetchScorecardDetails();
    }, [scorecardId]);

    useEffect(() => {
        const fetchQuizData = async () => {
            try {
                setLoading(true);
                const questionsResponse = await api.get(`/quizzes/${quizId}/questions`);
                setQuestions(questionsResponse?.data?.questions || []);
            } catch (error) {
                console.error("Error fetching quiz data:", error);
                notification.error({
                    message: "Error Fetching Data",
                    description: "Could not load the quiz questions. Please try again later.",
                });
            } finally {
                setLoading(false);
            }
        };

        if (quizId) fetchQuizData();
    }, [quizId]);

    const downloadPDF = async () => {
        const element = scorecardRef.current;

        try {
            const canvas = await html2canvas(element, { useCORS: true });
            const imgData = canvas.toDataURL("image/png");

            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

            const imgWidth = 60;
            const imgHeight = 60;
            const x = (pdfWidth - imgWidth) / 2;
            const y = (pdfHeight - imgHeight) / 2;

            pdf.addImage(akjLogo, "jpeg", x, y, imgWidth, imgHeight, "", "FAST");
            pdf.setTextColor(200, 200, 200);
            pdf.setFontSize(20);
            pdf.text("AKJ Classes", pdfWidth / 2, pdfHeight - 20, { align: "center" });

            pdf.save("scorecard.pdf");
            message.success("PDF downloaded successfully!");
        } catch (error) {
            console.error("Error generating PDF:", error);
            message.error("Failed to generate PDF");
        }
    };

    const showModal = (question) => {
        setCurrentQuestion(question);
        setIsModalOpen(true);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        setCurrentQuestion(null);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100">
                <Spin size="large" />
            </div>
        );
    }

    if (!scorecard) {
        return (
            <Text className="block text-center text-red-500 mt-5">
                Scorecard not found
            </Text>
        );
    }

    const {
        score,
        totalMarks,
        correctQuestions,
        incorrectQuestions,
        answers,
        createdAt,
        endTime,
    } = scorecard;

    const totalQuestions = questions.length;
    const unattemptedQuestions =
        totalQuestions - (correctQuestions + incorrectQuestions);
    const performancePercentage = ((score / totalMarks) * 100).toFixed(2);

    const pieData = [
        { type: "Correct", value: correctQuestions },
        { type: "Incorrect", value: incorrectQuestions },
        { type: "Unattempted", value: unattemptedQuestions },
    ];

    const pieConfig = {
        appendPadding: 10,
        data: pieData,
        angleField: "value",
        colorField: "type",
        radius: 0.9,
        legend: { position: "bottom" },
        color: ["#52c41a", "#f5222d", "#faad14"],
        label: {
            type: "outer",
            content: "{name}: {percentage}",
            style: { fontSize: 12, textAlign: "center" },
        },
        interactions: [{ type: "element-active" }],
    };

    const columnConfig = {
        data: pieData,
        xField: "type",
        yField: "value",
        columnWidthRatio: 0.8,
        label: {
            position: "middle",
            style: { fill: "#ffffff", opacity: 0.6 },
        },
        meta: {
            type: { alias: "Category" },
            value: { alias: "Questions" },
        },
    };

    const questionColumns = [
        {
            title: "Question Text",
            dataIndex: "questionText",
            key: "questionText",
            render: (text, record) => (
                <a onClick={() => showModal(record)} style={{ cursor: "pointer" }}>
                    {text}
                </a>
            ),
        },
        {
            title: "Selected Option",
            key: "selectedOption",
            render: (_, record) => {
                const userAnswer = answers.find((a) => a.questionId === record.id);
                const selectedOption = record.options.find(
                    (opt) => opt.id === userAnswer?.selectedOptionId
                );
                return (
                    <Text>
                        {selectedOption?.optionText || <Tag color="orange">Unattempted</Tag>}
                    </Text>
                );
            },
        },
        {
            title: "Correct Option",
            key: "correctOption",
            render: (_, record) => {
                const correctOption = record.options.find((opt) => opt.isCorrect);
                return (
                    <Text>
                        {correctOption?.optionText} <Tag color="green">Correct</Tag>
                    </Text>
                );
            },
        },
    ];

    console.log("Quesation data print:", questions);
    console.log("Score card print:", scorecard);

    return (
        <Layout className="min-h-screen bg-gray-50" ref={scorecardRef}>
            <Header className="bg-white px-5 border-b border-gray-200">
                <Row justify="space-between" align="middle">
                    <Col>
                        <Title level={5} className="text-black m-0">
                            Scorecard - {scorecard?.quizId?.quizName}
                        </Title>
                    </Col>
                    <Col>
                        <GiCancel
                            className="mt-4 cursor-pointer"
                            size={25}
                            onClick={() => navigate(`/test/${folderId}`)}
                        />
                    </Col>
                </Row>
            </Header>

            <Content className="p-5">
                <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                        <Card title="Score Overview">
                            <div className="text-center">
                                <Title>{score}</Title>
                                <Text>Out of {totalMarks}</Text>
                            </div>
                            <Divider />
                            <Progress percent={performancePercentage} />
                        </Card>
                    </Col>

                    <Col xs={24} md={12}>
                        <Card title="Performance Breakdown">
                            <Pie {...pieConfig} />
                        </Card>
                    </Col>
                </Row>

                <Divider />

                <Row>
                    <Col xs={24}>
                        <Card title="Time vs Performance">
                            <Column {...columnConfig} />
                        </Card>
                    </Col>
                </Row>

                <Divider />

                <Row>
                    <Col span={24}>
                        <Table
                            dataSource={questions.map((q) => ({
                                ...q,
                                key: q.id,
                            }))}
                            columns={questionColumns}
                            pagination={{ pageSize: 5 }}
                        />
                    </Col>
                </Row>

                {/* Modal for Question Details */}
                {currentQuestion && (
                    <Modal
                        visible={isModalOpen}
                        onCancel={handleCancel}
                        footer={null}
                    >
                        <Text strong>Question: </Text>
                        <Text>{currentQuestion.questionText}</Text>
                        <Divider />
                        <Text strong>Options:</Text>
                        <ul>
                            {currentQuestion.options.map((opt, index) => (
                                <li key={opt.id}>
                                    <Text >
                                        <span className="font-bold">
                                            Option-{index + 1}:
                                        </span>
                                        {opt.optionText}{" "}
                                        {opt.isCorrect && <Tag color="green">Correct</Tag>}
                                    </Text>
                                </li>
                            ))}
                        </ul>
                    </Modal>
                )}
            </Content>
        </Layout>
    );
};

export default Scorecard;
