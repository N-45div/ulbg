import { FaPenToSquare } from "react-icons/fa6";
import { TbSettingsMinus, TbSettingsPlus } from "react-icons/tb";
import { useState, useContext, useRef, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useHighlightedText } from "../context/HighlightedTextContext";
import { useQuestionType } from "../context/QuestionTypeContext";
import EmploymentAgreement from "../utils/EmploymentAgreement";
import { determineQuestionType } from "../utils/questionTypeUtils";
import { ThemeContext } from "../context/ThemeContext";
import AIAnalysisPanel from "../components/AIAnalysisPanel";
import { useLocation, useNavigate } from "react-router";
import { CrispChat } from "../bot/knowledge";
import { useScore } from "../context/ScoreContext";
import Shepherd from "shepherd.js";
import "shepherd.js/dist/css/shepherd.css";

// Type definitions for Shepherd.js
interface ShepherdStep {
  id: string;
  text: string;
  attachTo: { element: Element | string | null; on: string };
  buttons: Array<{
    text: string;
    action: () => void;
  }>;
  classes?: string;
}

interface ShepherdTour {
  start: () => void;
  show: (stepId: string) => void;
  next: () => void;
  complete: () => void;
  addStep: (step: ShepherdStep) => void;
}

interface ShepherdStatic {
  Tour: new (options: {
    defaultStepOptions: {
      cancelIcon: { enabled: boolean };
      classes: string;
      scrollTo: { behavior: "smooth"; block: "center" };
    };
    useModalOverlay: boolean;
    confirmCancel: boolean;
    tourName: string;
  }) => ShepherdTour;
}

const ShepherdStatic = Shepherd as unknown as ShepherdStatic;

const icons = [
  { icon: <FaPenToSquare />, label: "Edit PlaceHolder" },
  { icon: <TbSettingsMinus />, label: "Small Condition" },
  { icon: <TbSettingsPlus />, label: "Big Condition" },
];

const LevelTwoPart_Two = () => {
  const { isDarkMode } = useContext(ThemeContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [tooltip, setTooltip] = useState<string | null>(null);
  const { highlightedTexts, addHighlightedText } = useHighlightedText();
  const { selectedTypes } = useQuestionType();
  const documentRef = useRef<HTMLDivElement>(null);
  const tourRef = useRef<ShepherdTour | null>(null);

  // Scoring system
  const { levelTwoScore, setLevelTwoScore } = useScore();
  const [score, setScore] = useState<number>(levelTwoScore);
  const [scoreChange, setScoreChange] = useState<number | null>(null);
  const [foundPlaceholders, setFoundPlaceholders] = useState<string[]>([]);
  const [foundSmallConditions, setFoundSmallConditions] = useState<string[]>([]);
  const [foundBigConditions, setFoundBigConditions] = useState<string[]>([]);

  useEffect(() => {
    setLevelTwoScore(score);
  }, [score, setLevelTwoScore]);

  useEffect(() => {
    console.log("LevelTwoPart_Two - Rendering at:", location.pathname);
    sessionStorage.removeItem("level");
    sessionStorage.setItem("level", location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.removeItem("selectedQuestionTypes_2");
      sessionStorage.removeItem("typeChangedStates_2");
      sessionStorage.removeItem("questionOrder_2");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Highlight [Employer Name] and ensure it’s selectable
  useEffect(() => {
    const highlightEmployerName = () => {
      const elements = document.querySelectorAll("span, p, div");
      const employerElement = Array.from(elements).find((el) =>
        el.textContent?.includes("[Employer Name]")
      ) as HTMLElement | undefined;

      if (employerElement) {
        // Ensure the element is selectable
        employerElement.style.userSelect = "text";
        employerElement.style.webkitUserSelect = "text";
        employerElement.style.pointerEvents = "auto";

        // Wrap [Employer Name] in a span if it’s not already
        const textNode = Array.from(employerElement.childNodes).find(
          (node) => node.textContent?.includes("[Employer Name]")
        );
        if (textNode && textNode.nodeType === Node.TEXT_NODE) {
          const span = document.createElement("span");
          span.className = "employer-name-highlight";
          span.id = "employer-name-placeholder";
          span.textContent = "[Employer Name]";
          const remainingText = textNode.textContent?.split("[Employer Name]");
          textNode.replaceWith(
            remainingText?.[0] || "",
            span,
            remainingText?.[1] || ""
          );
        }
        employerElement.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        console.log("[Employer Name] not found in DOM yet.");
      }

      // Highlight [Employee Name]
      const employeeElement = Array.from(elements).find((el) =>
        el.textContent?.includes("[Employee Name]")
      ) as HTMLElement | undefined;

      if (employeeElement) {
        const textNode = Array.from(employeeElement.childNodes).find(
          (node) => node.textContent?.includes("[Employee Name]")
        );
        if (textNode && textNode.nodeType === Node.TEXT_NODE) {
          const span = document.createElement("span");
          span.className = "employer-name-highlight";
          span.id = "employee-name-placeholder";
          span.textContent = "[Employee Name]";
          const remainingText = textNode.textContent?.split("[Employee Name]");
          textNode.replaceWith(
            remainingText?.[0] || "",
            span,
            remainingText?.[1] || ""
          );
        }
      }

      // Highlight [Agreement Date]
      const agreementDateElement = Array.from(elements).find((el) =>
        el.textContent?.includes("[Agreement Date]")
      ) as HTMLElement | undefined;

      if (agreementDateElement) {
        const textNode = Array.from(agreementDateElement.childNodes).find(
          (node) => node.textContent?.includes("[Agreement Date]")
        );
        if (textNode && textNode.nodeType === Node.TEXT_NODE) {
          const span = document.createElement("span");
          span.className = "employer-name-highlight";
          span.id = "agreement-date-placeholder";
          span.textContent = "[Agreement Date]";
          const remainingText = textNode.textContent?.split("[Agreement Date]");
          textNode.replaceWith(
            remainingText?.[0] || "",
            span,
            remainingText?.[1] || ""
          );
        }
      }
    };

    // Prevent events that might block selection
    const enableSelection = (e: Event) => {
      e.stopPropagation();
    };

    const container = document.querySelector(".employment-agreement-container");
    if (container) {
      container.addEventListener("mousedown", enableSelection);
      container.addEventListener("selectstart", enableSelection);
      container.addEventListener("dragstart", enableSelection);
    }

    // Run immediately and set up a MutationObserver in case the DOM changes
    highlightEmployerName();

    const observer = new MutationObserver(() => {
      highlightEmployerName();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      if (container) {
        container.removeEventListener("mousedown", enableSelection);
        container.removeEventListener("selectstart", enableSelection);
        container.removeEventListener("dragstart", enableSelection);
      }
    };
  }, []);

  const getDocumentText = () => {
    return documentRef.current?.textContent || "";
  };

  const simulateEditPlaceholderClick = () => {
    const editPlaceholderButton = document.querySelector("#edit-placeholder") as HTMLButtonElement | null;
    if (editPlaceholderButton) {
      editPlaceholderButton.click();
    }
  };

  const simulateSmallConditionClick = () => {
    const smallConditionButton = document.querySelector("#icon-small-condition") as HTMLButtonElement | null;
    if (smallConditionButton) {
      smallConditionButton.click();
    }
  };

  const simulateBigConditionClick = () => {
    const bigConditionButton = document.querySelector("#icon-big-condition") as HTMLButtonElement | null;
    if (bigConditionButton) {
      bigConditionButton.click();
    }
  };

  const handleIconClick = (label: string) => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    let textWithoutBrackets = selectedText;
    let hasValidBrackets = false;
    let hasValidSpanClass = false;

    if (selectedText.startsWith("[") && selectedText.endsWith("]")) {
      textWithoutBrackets = selectedText.slice(1, -1);
      hasValidBrackets = true;
      hasValidSpanClass = true;
    } else if (selectedText.startsWith("{") && selectedText.endsWith("}")) {
      textWithoutBrackets = selectedText.slice(1, -1);
      hasValidBrackets = true;
    } else if (selectedText.startsWith("(") && selectedText.endsWith(")")) {
      textWithoutBrackets = selectedText.slice(1, -1);
      hasValidBrackets = true;
    } else {
      const node = selection.anchorNode;
      if (node && node.parentElement) {
        const parent = node.parentElement;
        const classList = Array.from(parent.classList);
        const placeholderClass = classList.find(cls => cls.startsWith("placeholder-"));

        if (placeholderClass) {
          hasValidSpanClass = true;
          textWithoutBrackets = parent.textContent || selectedText;
        }
      }
    }

    if (
      (label === "Edit PlaceHolder" && !hasValidSpanClass) ||
      ((label === "Small Condition" || label === "Big Condition") && !hasValidBrackets)
    ) {
      console.log("Selected text does not have valid brackets:", selectedText);
      return;
    }

    const isCorrectButton =
      (label === "Edit PlaceHolder" && hasValidSpanClass) ||
      (label === "Small Condition" && hasValidBrackets) ||
      (label === "Big Condition" && hasValidBrackets);

    if (isCorrectButton) {
      if (label === "Edit PlaceHolder" && !foundPlaceholders.includes(textWithoutBrackets)) {
        setScore((prevScore) => prevScore + 3);
        setScoreChange(3);
        setTimeout(() => setScoreChange(null), 2000);
        setFoundPlaceholders((prev) => [...prev, textWithoutBrackets]);
      } else if (label === "Small Condition" && !foundSmallConditions.includes(textWithoutBrackets)) {
        setScore((prevScore) => prevScore + 3);
        setScoreChange(3);
        setTimeout(() => setScoreChange(null), 2000);
        setFoundSmallConditions((prev) => [...prev, textWithoutBrackets]);
      } else if (label === "Big Condition" && !foundBigConditions.includes(textWithoutBrackets)) {
        setScore((prevScore) => prevScore + 3);
        setScoreChange(3);
        setTimeout(() => setScoreChange(null), 2000);
        setFoundBigConditions((prev) => [...prev, textWithoutBrackets]);
      }
    } else {
      const newScore = Math.max(0, score - 2);
      setScore(newScore);
      if (score > 0) {
        setScoreChange(-2);
        setTimeout(() => setScoreChange(null), 2000);
      }
      return;
    }

    if (label === "Edit PlaceHolder") {
      if (highlightedTexts.includes(textWithoutBrackets)) {
        console.log("Placeholder already highlighted:", textWithoutBrackets);
        alert("This placeholder has already been added!");
        return;
      }
      console.log("Selected Edit Placeholder:", textWithoutBrackets);
      addHighlightedText(textWithoutBrackets);
      const span = document.createElement("span");
      span.style.backgroundColor = isDarkMode ? "rgba(255, 245, 157, 0.5)" : "rgba(255, 245, 157, 0.7)";
      span.textContent = selectedText;
      range.deleteContents();
      range.insertNode(span);

      const currentStep = sessionStorage.getItem("tourStep") || "welcome";
      if (currentStep === "edit-placeholder-employer-name" && textWithoutBrackets === "Employer Name") {
        sessionStorage.setItem("tourStep", "selected-placeholder-employer-name");
        tourRef.current?.show("selected-placeholder-employer-name");
      } else if (currentStep === "edit-placeholder-employee-name" && textWithoutBrackets === "Employee Name") {
        sessionStorage.setItem("tourStep", "selected-placeholder-employee-name");
        tourRef.current?.show("selected-placeholder-employee-name");
      } else if (currentStep === "edit-placeholder-agreement-date" && textWithoutBrackets === "Agreement Date") {
        sessionStorage.setItem("tourStep", "selected-placeholder-agreement-date");
        tourRef.current?.show("selected-placeholder-agreement-date");
      }
    } else if (label === "Small Condition") {
      if (!(selectedText.startsWith("{") && selectedText.endsWith("}")) || 
          selectedText.length < 35 || 
          selectedText.length > 450) return;
      if (!highlightedTexts.includes(textWithoutBrackets) 
        && !(highlightedTexts.includes("The Employee shall not receive additional payment for overtime worked") && textWithoutBrackets === "The Employee is entitled to overtime pay for authorized overtime work")
        && !(highlightedTexts.includes("The Employee is entitled to overtime pay for authorized overtime work") && textWithoutBrackets === "The Employee shall not receive additional payment for overtime worked")
      ) {
        addHighlightedText(textWithoutBrackets);
      }
      const span = document.createElement("span");
      span.style.backgroundColor = isDarkMode ? "rgba(129, 236, 236, 0.5)" : "rgba(129, 236, 236, 0.7)";
      span.textContent = selectedText;
      range.deleteContents();
      range.insertNode(span);

      const currentStep = sessionStorage.getItem("tourStep") || "welcome";
      if (currentStep === "small-condition-button") {
        sessionStorage.setItem("tourStep", "selected-small-condition");
        tourRef.current?.show("selected-small-condition");
      }
    } else if (label === "Big Condition") {
      if (!(selectedText.startsWith("(") && selectedText.endsWith(")"))) return;
      console.log("Selected Big Condition:", selectedText);

      let clauseContent = textWithoutBrackets;
      const headingsToStrip = ["PROBATIONARY PERIOD", "PENSION"];
      for (const heading of headingsToStrip) {
        if (textWithoutBrackets.startsWith(heading)) {
          clauseContent = textWithoutBrackets.slice(heading.length).trim();
          console.log(`Stripped heading '${heading}', clauseContent:`, clauseContent);
          break;
        }
      }

      addHighlightedText(clauseContent);

      const fragment = document.createDocumentFragment();
      const contents = range.cloneContents();
      const applyHighlight = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const span = document.createElement("span");
          span.style.backgroundColor = isDarkMode ? "rgba(186, 220, 88, 0.5)" : "rgba(186, 220, 88, 0.7)";
          span.textContent = node.textContent || "";
          return span;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          const newElement = document.createElement(element.tagName);
          for (const attr of element.attributes) {
            newElement.setAttribute(attr.name, attr.value);
          }
          element.childNodes.forEach((child) => {
            const newChild = applyHighlight(child);
            if (newChild) newElement.appendChild(newChild);
          });
          return newElement;
        }
        return null;
      };

      contents.childNodes.forEach((node) => {
        const newNode = applyHighlight(node);
        if (newNode) fragment.appendChild(newNode);
      });

      range.deleteContents();
      range.insertNode(fragment);

      const probationClauseContent = "The first [Probation Period Length] of employment will be a probationary period. The Company shall assess the Employee's performance and suitability during this time. Upon successful completion, the Employee will be confirmed in their role.";
      const pensionClauseContent = "The Employee will be enrolled in the Company's pension scheme in accordance with auto-enrolment legislation.";

      const normalizeText = (text: string) => text.replace(/\s+/g, "");
      const normalizedSelectedText = normalizeText(textWithoutBrackets);
      const normalizedProbationClause = normalizeText(probationClauseContent);
      const normalizedPensionClause = normalizeText(pensionClauseContent);

      if (normalizedSelectedText === normalizedProbationClause) {
        console.log("Probation Clause matched, adding question instead of placeholder");
        addHighlightedText("Is the clause of probationary period applicable?");
      } else if (normalizedSelectedText === normalizedPensionClause) {
        console.log("Pension Clause matched, adding Pension question");
        addHighlightedText("Is the Pension clause applicable?");
      } else {
        console.log("No clause matched.");
      }

      const currentStep = sessionStorage.getItem("tourStep") || "welcome";
      if (currentStep === "big-condition-button") {
        sessionStorage.setItem("tourStep", "selected-big-condition");
        tourRef.current?.show("selected-big-condition");
      }
    }
  };

  // Set up the Shepherd.js tour
  useEffect(() => {
    const selectedPart = parseInt(localStorage.getItem("selectedPart") || "0", 10);
    if (selectedPart !== 1 && selectedPart !== 4) {
      return; // Only start the tour for specific parts
    }

    const tour = new ShepherdStatic.Tour({
      defaultStepOptions: {
        cancelIcon: { enabled: true },
        classes: "shadow-md bg-purple-dark",
        scrollTo: { behavior: "smooth", block: "center" },
      },
      useModalOverlay: true,
      confirmCancel: false,
      tourName: `level-two-part-two-${Date.now()}`,
    });

    tourRef.current = tour;

    tour.addStep({
      id: "welcome",
      text: `
        <div class="welcome-message">
          <strong class="welcome-title">🚀 Welcome to Part II of Level 2, brave document warrior!</strong>
          <p class="welcome-text">It's time to master the art of document automation.</p>
          <p class="mission-text"><strong>Your mission:</strong> Automate an employment agreement using placeholders and conditions. Let's dive in!</p>
        </div>
      `,
      attachTo: { element: document.body, on: "bottom-start" },
      classes: "shepherd-theme-custom animate__animated animate__fadeIn",
      buttons: [
        {
          text: "Start Learning →",
          action: () => {
            sessionStorage.setItem("tourStep", "placeholders");
            tour.next();
          },
        },
      ],
    });

    tour.addStep({
      id: "placeholders",
      text: "Behold your <strong>employment agreement!</strong> Notice those bits wrapped in square brackets, like <strong>[Employer Name]</strong>? Those are placeholders—your secret weapons for automation. Any text inside <strong>[square brackets]</strong> is a placeholder waiting to be customized.<br> Let's start with [Employer Name] by highlighting it and verifying your selection. Then, click on the 'Edit Placeholder' button to automate your placeholder.",
      attachTo: { element: document.body, on: "bottom-start" },
      buttons: [
        {
          text: "Next →",
          action: () => {
            sessionStorage.setItem("tourStep", "select-employer-name");
            tour.next();
          },
        },
      ],
    });

    tour.addStep({
      id: "select-employer-name",
      text: "Select <strong>[Employer Name]</strong> in the 'PARTIES' section (under 'Employer:') without spaces before or after the square brackets [].",
      attachTo: {
        element: document.querySelector("#employer-name-placeholder") ?? document.body,
        on: "bottom",
      },
      buttons: [
        {
          text: "Verify Selection ✅",
          action: function (this: ShepherdTour) {
            const selection = window.getSelection();
            const selectedText = selection ? selection.toString().trim() : "";
            const employerNamePlaceholder = "[Employer Name]";

            if (selectedText === employerNamePlaceholder) {
              sessionStorage.setItem("tourStep", "edit-placeholder-employer-name");
              this.next();
            } else {
              alert("⚠️ Please select [Employer Name] exactly as shown in the 'PARTIES' section.");
            }
          },
        },
      ],
    });

    tour.addStep({
      id: "edit-placeholder-employer-name",
      text: "Now click on the <strong>Edit Placeholder</strong> button to automate [Employer Name].",
      attachTo: { element: "#edit-placeholder", on: "bottom" },
      buttons: [
        {
          text: "Next →",
          action: () => {
            simulateEditPlaceholderClick();
          },
        },
      ],
    });

    tour.addStep({
      id: "selected-placeholder-employer-name",
      text: "Your selected placeholder <strong>[Employer Name]</strong> is now visible here 📌 and ready for editing.",
      attachTo: { element: "#selected-placeholder0", on: "bottom" },
      buttons: [
        {
          text: "Next →",
          action: () => {
            sessionStorage.setItem("tourStep", "questionnaire-employer-name");
            tour.next();
          },
        },
      ],
    });

    tour.addStep({
      id: "questionnaire-employer-name",
      text: "Now that you've selected the [Employer Name] placeholder, let's bring it to life. Head to the 'Questionnaire' page to draft a question for this placeholder. Click <strong>'Questionnaire'</strong> in the menu bar to proceed!",
      attachTo: { element: "#Questionnaire-button", on: "right" },
      buttons: [
        {
          text: "Go to Questionnaire →",
          action: () => {
            sessionStorage.setItem("tourStep", "return-from-questionnaire-employer-name");
            tour.complete();
            navigate("/Questionnaire");
          },
        },
      ],
    });

    tour.addStep({
      id: "return-from-questionnaire-employer-name",
      text: "Great job! You successfully automated the <strong>[Employer Name]</strong> placeholder. Let's move on to the next placeholder.",
      attachTo: { element: "#selected-placeholder0", on: "bottom" },
      buttons: [
        {
          text: "Next →",
          action: () => {
            sessionStorage.setItem("tourStep", "introduce-employee-name");
            tour.next();
          },
        },
      ],
    });

    tour.addStep({
      id: "introduce-employee-name",
      text: "Next, let's automate another placeholder. Select <strong>[Employee Name]</strong> in the 'PARTIES' section (under 'Employee:') without spaces before or after the square brackets [].",
      attachTo: {
        element: document.querySelector("#employee-name-placeholder") ?? document.body,
        on: "bottom",
      },
      buttons: [
        {
          text: "Verify Selection ✅",
          action: function (this: ShepherdTour) {
            const selection = window.getSelection();
            const selectedText = selection ? selection.toString().trim() : "";
            const employeeNamePlaceholder = "[Employee Name]";

            if (selectedText === employeeNamePlaceholder) {
              sessionStorage.setItem("tourStep", "edit-placeholder-employee-name");
              this.next();
            } else {
              alert("⚠️ Please select [Employee Name] exactly as shown in the 'PARTIES' section.");
            }
          },
        },
      ],
    });

    tour.addStep({
      id: "edit-placeholder-employee-name",
      text: "Now click on the <strong>Edit Placeholder</strong> button to automate [Employee Name].",
      attachTo: { element: "#edit-placeholder", on: "bottom" },
      buttons: [
        {
          text: "Next →",
          action: () => {
            simulateEditPlaceholderClick();
          },
        },
      ],
    });

    tour.addStep({
      id: "selected-placeholder-employee-name",
      text: "Your selected placeholder <strong>[Employee Name]</strong> is now visible here 📌 and ready for editing.",
      attachTo: { element: "#selected-placeholder1", on: "bottom" },
      buttons: [
        {
          text: "Next →",
          action: () => {
            sessionStorage.setItem("tourStep", "introduce-agreement-date");
            tour.next();
          },
        },
      ],
    });

    tour.addStep({
      id: "introduce-agreement-date",
      text: "Let's automate one more placeholder. Select <strong>[Agreement Date]</strong> in the 'PARTIES' section (at the end of the section) without spaces before or after the square brackets [].",
      attachTo: {
        element: document.querySelector("#agreement-date-placeholder") ?? document.body,
        on: "bottom",
      },
      buttons: [
        {
          text: "Verify Selection ✅",
          action: function (this: ShepherdTour) {
            const selection = window.getSelection();
            const selectedText = selection ? selection.toString().trim() : "";
            const agreementDatePlaceholder = "[Agreement Date]";

            if (selectedText === agreementDatePlaceholder) {
              sessionStorage.setItem("tourStep", "edit-placeholder-agreement-date");
              this.next();
            } else {
              alert("⚠️ Please select [Agreement Date] exactly as shown in the 'PARTIES' section.");
            }
          },
        },
      ],
    });

    tour.addStep({
      id: "edit-placeholder-agreement-date",
      text: "Now click on the <strong>Edit Placeholder</strong> button to automate [Agreement Date].",
      attachTo: { element: "#edit-placeholder", on: "bottom" },
      buttons: [
        {
          text: "Next →",
          action: () => {
            simulateEditPlaceholderClick();
          },
        },
      ],
    });

    tour.addStep({
      id: "selected-placeholder-agreement-date",
      text: "Your selected placeholder <strong>[Agreement Date]</strong> is now visible here 📌 and ready for editing.",
      attachTo: { element: "#selected-placeholder2", on: "bottom" },
      buttons: [
        {
          text: "Next →",
          action: () => {
            sessionStorage.setItem("tourStep", "questionnaire-employee-name-agreement-date");
            tour.next();
          },
        },
      ],
    });

    tour.addStep({
      id: "questionnaire-employee-name-agreement-date",
      text: "You've selected <strong>[Employee Name]</strong> and <strong>[Agreement Date]</strong>. Let's draft questions for these placeholders. Head to the 'Questionnaire' page by clicking <strong>'Questionnaire'</strong> in the menu bar.",
      attachTo: { element: "#Questionnaire-button", on: "right" },
      buttons: [
        {
          text: "Go to Questionnaire →",
          action: () => {
            sessionStorage.setItem("tourStep", "return-from-questionnaire-employee-name-agreement-date");
            tour.complete();
            navigate("/Questionnaire");
          },
        },
      ],
    });

    tour.addStep({
      id: "return-from-questionnaire-employee-name-agreement-date",
      text: "Great job! You successfully automated the placeholders <strong>[Employee Name]</strong> and <strong>[Agreement Date]</strong>! Let's move on to automating conditions.",
      attachTo: { element: "#selected-placeholder2", on: "bottom" },
      buttons: [
        {
          text: "Next →",
          action: () => {
            sessionStorage.setItem("tourStep", "introduce-small-condition");
            tour.next();
          },
        },
      ],
    });

    tour.addStep({
      id: "introduce-small-condition",
      text: "Now let's automate a small condition. Conditions wrapped in <strong>{curly braces}</strong> can be toggled on or off. Select <strong>{The Employee is entitled to overtime pay for authorized overtime work.}</strong> in the 'WORKING HOURS' section.",
      attachTo: {
        element: document.querySelector("#employment-agreement-working-hours") ?? document.body,
        on: "bottom",
      },
      buttons: [
        {
          text: "Verify Selection ✅",
          action: function (this: ShepherdTour) {
            const selection = window.getSelection();
            const selectedText = selection ? selection.toString().trim() : "";
            const overtimePayClause = "{The Employee is entitled to overtime pay for authorized overtime work.}";

            if (selectedText === overtimePayClause) {
              sessionStorage.setItem("tourStep", "small-condition-button");
              this.next();
            } else {
              alert("⚠️ Please select {The Employee is entitled to overtime pay for authorized overtime work.} exactly as shown in the 'WORKING HOURS' section.");
            }
          },
        },
      ],
    });

    tour.addStep({
      id: "small-condition-button",
      text: "Now click on the <strong>Small Condition</strong> button to automate this condition.",
      attachTo: { element: "#icon-small-condition", on: "bottom" },
      buttons: [
        {
          text: "Next →",
          action: () => {
            simulateSmallConditionClick();
          },
        },
      ],
    });

    tour.addStep({
      id: "selected-small-condition",
      text: "Your selected condition <strong>{The Employee is entitled to overtime pay for authorized overtime work.}</strong> is now visible here 📌 and ready for editing.",
      attachTo: { element: "#selected-placeholder3", on: "bottom" },
      buttons: [
        {
          text: "Next →",
          action: () => {
            sessionStorage.setItem("tourStep", "questionnaire-small-condition");
            tour.next();
          },
        },
      ],
    });

    tour.addStep({
      id: "questionnaire-small-condition",
      text: "Let's draft a question for this condition. Head to the 'Questionnaire' page by clicking <strong>'Questionnaire'</strong> in the menu bar to create a question like 'Would the employee be entitled to overtime pay?'.",
      attachTo: { element: "#Questionnaire-button", on: "right" },
      buttons: [
        {
          text: "Go to Questionnaire →",
          action: () => {
            sessionStorage.setItem("tourStep", "return-from-questionnaire-small-condition");
            tour.complete();
            navigate("/Questionnaire");
          },
        },
      ],
    });

    tour.addStep({
      id: "return-from-questionnaire-small-condition",
      text: "Good job automating the small condition <strong>{The Employee is entitled to overtime pay for authorized overtime work.}</strong>! Let's move on to a big condition.",
      attachTo: { element: "#selected-placeholder3", on: "bottom" },
      buttons: [
        {
          text: "Next →",
          action: () => {
            sessionStorage.setItem("tourStep", "introduce-big-condition");
            tour.next();
          },
        },
      ],
    });

    tour.addStep({
      id: "introduce-big-condition",
      text: "Now let's automate a big condition. Conditions wrapped in <strong>(parentheses)</strong> can include entire sections. Select the entire <strong>(PROBATIONARY PERIOD...)</strong> section, including the heading and paragraph, under the 'PROBATIONARY PERIOD' section.",
      attachTo: {
        element: document.querySelector("#employment-agreement-probationary-period") ?? document.body,
        on: "bottom",
      },
      buttons: [
        {
          text: "Verify Selection ✅",
          action: function (this: ShepherdTour) {
            const selection = window.getSelection();
            const selectedText = selection ? selection.toString().trim() : "";
            const probationaryPeriodClauseStart = "(PROBATIONARY PERIOD";
            const probationaryPeriodClauseEnd = "confirmed in their role.)";

            if (selectedText.startsWith(probationaryPeriodClauseStart) && selectedText.endsWith(probationaryPeriodClauseEnd)) {
              sessionStorage.setItem("tourStep", "big-condition-button");
              this.next();
            } else {
              alert("⚠️ Please select the entire (PROBATIONARY PERIOD...) section, including the heading and paragraph.");
            }
          },
        },
      ],
    });

    tour.addStep({
      id: "big-condition-button",
      text: "Now click on the <strong>Big Condition</strong> button to automate this section.",
      attachTo: { element: "#icon-big-condition", on: "bottom" },
      buttons: [
        {
          text: "Next →",
          action: () => {
            simulateBigConditionClick();
          },
        },
      ],
    });

    tour.addStep({
      id: "selected-big-condition",
      text: "Your selected condition <strong>(PROBATIONARY PERIOD...)</strong> is now visible here 📌. Notice that an additional question 'Is the clause of probationary period applicable?' has been automatically added.",
      attachTo: { element: "#selected-placeholder4", on: "bottom" },
      buttons: [
        {
          text: "Next →",
          action: () => {
            sessionStorage.setItem("tourStep", "questionnaire-big-condition");
            tour.next();
          },
        },
      ],
    });

    tour.addStep({
      id: "questionnaire-big-condition",
      text: "Let's draft a question for this condition. Head to the 'Questionnaire' page by clicking <strong>'Questionnaire'</strong> in the menu bar to create a question like 'Is the clause of probationary period included?'.",
      attachTo: { element: "#Questionnaire-button", on: "right" },
      buttons: [
        {
          text: "Go to Questionnaire →",
          action: () => {
            sessionStorage.setItem("tourStep", "return-from-questionnaire-big-condition");
            tour.complete();
            navigate("/Questionnaire");
          },
        },
      ],
    });

    tour.addStep({
      id: "return-from-questionnaire-big-condition",
      text: "Well done! You've automated the complex condition <strong>(PROBATIONARY PERIOD...)</strong>. You've completed the automation tasks for Level 2 Part II!",
      attachTo: { element: "#selected-placeholder4", on: "bottom" },
      buttons: [
        {
          text: "Finish →",
          action: () => {
            sessionStorage.removeItem("tourStep");
            tour.complete();
          },
        },
      ],
    });

    const initialTourStep = sessionStorage.getItem("tourStep") || "welcome";
    if (initialTourStep) {
      tour.start();
      tour.show(initialTourStep);
    }

    return () => {
      tour.complete();
    };
  }, []);

  const selectedPart = parseInt(localStorage.getItem("selectedPart") || "0", 10);

  return (
    <div
      className={`w-full min-h-screen font-sans transition-all duration-500 ${
        isDarkMode
          ? "bg-gradient-to-br from-gray-800 via-gray-900 to-black"
          : "bg-gradient-to-br from-indigo-50 via-teal-50 to-pink-50"
      }`}
    >
      <style>
        {`
          .employment-agreement-container * {
            user-select: text !important;
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            -ms-user-select: text !important;
            pointer-events: auto !important;
          }
          .employer-name-highlight {
            background-color: #ffeb3b;
            padding: 2px 4px;
            border-radius: 3px;
            user-select: text !important;
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            -ms-user-select: text !important;
            pointer-events: auto !important;
            cursor: text !important;
          }
        `}
      </style>
      <Navbar
        level={"/Level-Two-Part-Two"}
        questionnaire={"/Questionnaire"}
        live_generation={"/Live_Generation"}
      />

      {selectedPart === 1 && (
        <h1
          className={`text-center mt-24 text-3xl font-bold tracking-wide ${
            isDarkMode ? "text-white" : "text-gray-800"
          }`}
        >
          LEVEL 1: Automate Placeholders
        </h1>
      )}
      {selectedPart === 2 && (
        <h1
          className={`text-center mt-24 text-3xl font-bold tracking-wide ${
            isDarkMode ? "text-white" : "text-gray-800"
          }`}
        >
          LEVEL 2: Automate Small Conditions
        </h1>
      )}
      {selectedPart === 3 && (
        <h1
          className={`text-center mt-24 text-3xl font-bold tracking-wide ${
            isDarkMode ? "text-white" : "text-gray-800"
          }`}
        >
          LEVEL 3: Automate Big Conditions
        </h1>
      )}

      <div className="fixed top-16 left-6 z-50 px-6 py-3">
        <div
          className={`p-3 rounded-full shadow-lg flex items-center ${
            isDarkMode ? "bg-gray-700 text-white" : "bg-teal-500 text-white"
          }`}
        >
          <span className="font-bold mr-2">Score:</span> {score}
          {scoreChange !== null && (
            <span
              className={`ml-2 text-sm font-bold ${
                scoreChange > 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {scoreChange > 0 ? `+${scoreChange}` : scoreChange}
            </span>
          )}
        </div>
      </div>
      <div className="fixed flex top-16 right-0 z-50 px-6 py-3 space-x-6">
        {icons.map(({ icon, label }, index) => {
          const shouldRender =
            (label === "Edit PlaceHolder" && selectedPart === 1) ||
            (label === "Small Condition" && selectedPart === 2) ||
            (label === "Big Condition" && selectedPart === 3) ||
            selectedPart === 4;

          if (!shouldRender) return null;

          return (
            <div key={index} className="relative flex items-center">
              <button
                id={label === "Edit PlaceHolder" ? "edit-placeholder" : `icon-${label.toLowerCase().replace(" ", "-")}`}
                className={`p-3 rounded-full shadow-lg transform hover:scale-110 transition-all duration-300 ease-in-out flex items-center justify-center text-2xl ${
                  isDarkMode
                    ? "bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-gray-700 hover:to-gray-800"
                    : "bg-gradient-to-r from-teal-400 to-cyan-400 text-white hover:from-teal-500 hover:to-cyan-500"
                }`}
                onMouseEnter={() => setTooltip(label)}
                onMouseLeave={() => setTooltip(null)}
                onClick={() => handleIconClick(label)}
              >
                {icon}
              </button>
              {tooltip === label && (
                <div
                  className={`absolute -left-10 top-full mt-2 px-3 py-1 text-sm text-white rounded-lg shadow-lg whitespace-nowrap animate-fadeIn ${
                    isDarkMode
                      ? "bg-gradient-to-r from-gray-700 to-gray-800"
                      : "bg-gradient-to-r from-gray-800 to-gray-900"
                  }`}
                >
                  {label}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div
        className={`max-w-5xl mx-auto p-8 rounded-3xl shadow-2xl border mt-24 transform transition-all duration-500 hover:shadow-3xl ${
          isDarkMode
            ? "bg-gray-800/90 backdrop-blur-lg border-gray-700/50"
            : "bg-white/90 backdrop-blur-lg border-teal-100/30"
        }`}
      >
        <h2
          className={`text-2xl font-semibold mb-6 tracking-wide ${
            isDarkMode ? "text-teal-300" : "text-teal-700"
          }`}
        >
          ☑️ Selected Placeholders
        </h2>
        {highlightedTexts.length > 0 ? (
          <ul
            className={`space-y-3 p-5 rounded-xl shadow-inner ${
              isDarkMode
                ? "bg-gradient-to-r from-gray-700/70 via-gray-800/70 to-gray-900/70"
                : "bg-gradient-to-r from-teal-50/70 via-cyan-50/70 to-indigo-50/70"
            }`}
          >
            {[...new Set(highlightedTexts)].map((text, index) => {
              const { primaryValue } = determineQuestionType(text);
              const questionType = selectedTypes[index] || "Text";
              return (
                <li
                  id={`selected-placeholder${index}`}
                  key={`${text}-${index}`}
                  className={`flex items-center justify-between p-4 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:-translate-y-1 ${
                    isDarkMode
                      ? "text-teal-200 bg-gray-600/80 hover:bg-gray-500/70"
                      : "text-teal-800 bg-white/80 hover:bg-teal-100/70"
                  }`}
                >
                  <div className="flex items-center">
                    <span
                      className={`mr-3 text-lg ${
                        isDarkMode ? "text-cyan-400" : "text-cyan-500"
                      }`}
                    >
                      ✓
                    </span>
                    <span className="text-sm font-medium truncate max-w-xs">
                      {primaryValue || text}
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      isDarkMode
                        ? "text-gray-300 bg-gray-500/50"
                        : "text-gray-600 bg-teal-100/50"
                    }`}
                  >
                    Type: {questionType}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <div
            className={`text-center py-8 rounded-xl shadow-inner ${
              isDarkMode
                ? "bg-gradient-to-r from-gray-700/70 via-gray-800/70 to-gray-900/70"
                : "bg-gradient-to-r from-teal-50/70 via-cyan-50/70 to-indigo-50/70"
            }`}
          >
            <p
              className={`italic text-lg ${
                isDarkMode ? "text-teal-400" : "text-teal-600"
              }`}
            >
              No placeholders selected yet
            </p>
          </div>
        )}
        {highlightedTexts.length > 0 && (
          <div className="mt-5 text-right">
            <span
              className={`text-sm px-3 py-1 rounded-full ${
                isDarkMode
                  ? "text-teal-300 bg-gray-600/50"
                  : "text-teal-600 bg-teal-100/50"
              }`}
            >
              Total Placeholders: {[...new Set(highlightedTexts)].length}
            </span>
          </div>
        )}
      </div>
      <div className="max-w-5xl mx-auto mt-10 px-8 pb-20" ref={documentRef}>
        <div
          className={`p-6 rounded-3xl shadow-xl border employment-agreement-container ${
            isDarkMode
              ? "bg-gray-800/80 backdrop-blur-md border-gray-700/20 bg-gradient-to-br from-gray-700/70 via-gray-800/70 to-gray-900/70"
              : "bg-white/80 backdrop-blur-md border-teal-100/20 bg-gradient-to-br from-teal-50/70 via-cyan-50/70 to-indigo-50/70"
          }`}
        >
          <EmploymentAgreement />
        </div>
        <AIAnalysisPanel
          documentText={getDocumentText()}
          highlightedTexts={highlightedTexts}
          isDarkMode={isDarkMode}
        />
        <CrispChat websiteId="cf9c462c-73de-461e-badf-ab3a1133bdde" />
      </div>
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <button
          onClick={() => window.location.href = "/dashboard"}
          className={`px-4 py-2 rounded-lg font-medium shadow-md transition-all duration-300 ${
            isDarkMode ? "bg-gray-700 text-teal-200 hover:bg-gray-600" : "bg-teal-200 text-teal-900 hover:bg-cyan-200"
          }`}
        >
          Home
        </button>
      </div>
    </div>
  );
};

export default LevelTwoPart_Two;
