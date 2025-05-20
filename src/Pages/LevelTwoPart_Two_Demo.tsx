import { FaPenToSquare } from "react-icons/fa6";
import { TbSettingsMinus, TbSettingsPlus } from "react-icons/tb";
import { ImLoop2 } from "react-icons/im";
import { useState, useContext, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useHighlightedText } from "../context/HighlightedTextContext";
import { useQuestionType } from "../context/QuestionTypeContext";
import EmploymentAgreement from "../utils/EmploymentAgreement";
import { determineQuestionType } from "../utils/questionTypeUtils";
import { ThemeContext } from "../context/ThemeContext";
import AIAnalysisPanel from "../components/AIAnalysisPanel";
import shepherd from "shepherd.js";
import "shepherd.js/dist/css/shepherd.css";

const icons = [
  { icon: <FaPenToSquare />, label: "Edit PlaceHolder" },
  { icon: <TbSettingsMinus />, label: "Small Condition" },
  { icon: <TbSettingsPlus />, label: "Big Condition" },
  { icon: <ImLoop2 />, label: "Loop" },
];

const LevelTwoPart_Two_Demo = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDarkMode } = useContext(ThemeContext);
  const [tooltip, setTooltip] = useState<string | null>(null);
  const { highlightedTexts, addHighlightedText } = useHighlightedText();
  const { selectedTypes, setSelectedTypes } = useQuestionType();
  const documentRef = useRef<HTMLDivElement>(null);
  const tourRef = useRef<shepherd.Tour | null>(null); // Store the tour instance

  useEffect(() => {
    console.log("LevelTwoPart_Two_Demo - Rendering at:", location.pathname);
    sessionStorage.removeItem("level");
    sessionStorage.setItem("level", location.pathname);

    // Initialize selectedTypes if not already set
    const savedTypes = sessionStorage.getItem("selectedQuestionTypes");
    if (!savedTypes && highlightedTexts.length > 0) {
      const initialTypes = highlightedTexts.map(() => "Text");
      setSelectedTypes(initialTypes);
      sessionStorage.setItem("selectedQuestionTypes", JSON.stringify(initialTypes));
    }
  }, [location.pathname, setSelectedTypes]); // Removed highlightedTexts dependency

  const getDocumentText = () => {
    return documentRef.current?.textContent || "";
  };

  // State to track the current tour step
  const [tourStep, setTourStep] = useState<string | null>(sessionStorage.getItem("tourStep") || "welcome");

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

    if (label === "Edit PlaceHolder") {
      if (highlightedTexts.includes(textWithoutBrackets)) {
        console.log("Placeholder already highlighted:", textWithoutBrackets);
        alert("This placeholder has already been added!");
        return;
      }
      console.log("Selected Edit Placeholder:", textWithoutBrackets);
      addHighlightedText(textWithoutBrackets);
      console.log("Updated highlightedTexts after adding:", highlightedTexts);

      // Update selectedTypes with default "Text" for new placeholder
      const newTypes = [...selectedTypes, "Text"];
      setSelectedTypes(newTypes);
      sessionStorage.setItem("selectedQuestionTypes", JSON.stringify(newTypes));

      const span = document.createElement("span");
      span.style.backgroundColor = isDarkMode ? "rgba(255, 245, 157, 0.5)" : "rgba(255, 245, 157, 0.7)";
      span.textContent = selectedText;
      range.deleteContents();
      range.insertNode(span);

      // Update tourStep based on the placeholder being added
      if (textWithoutBrackets === "Employer Name" && tourStep === "select-employer-name") {
        setTourStep("selected-placeholder-employer-name");
        sessionStorage.setItem("tourStep", "selected-placeholder-employer-name");
      } else if (textWithoutBrackets === "Employee Name" && tourStep === "introduce-employee-name") {
        setTourStep("selected-placeholder-employee-name");
        sessionStorage.setItem("tourStep", "selected-placeholder-employee-name");
      } else if (textWithoutBrackets === "Agreement Date" && tourStep === "introduce-agreement-date") {
        setTourStep("selected-placeholder-agreement-date");
        sessionStorage.setItem("tourStep", "selected-placeholder-agreement-date");
      }

      // Manually advance the tour to the next step
      if (tourRef.current) {
        tourRef.current.show(tourStep || "welcome");
      }
    } else if (label === "Small Condition") {
      if (!(selectedText.startsWith("{") && selectedText.endsWith("}")) || 
          selectedText.length < 35 || 
          selectedText.length > 450) return;
      addHighlightedText(textWithoutBrackets);

      // Update selectedTypes with default "Text" for new condition
      const newTypes = [...selectedTypes, "Text"];
      setSelectedTypes(newTypes);
      sessionStorage.setItem("selectedQuestionTypes", JSON.stringify(newTypes));

      const span = document.createElement("span");
      span.style.backgroundColor = isDarkMode ? "rgba(129, 236, 236, 0.5)" : "rgba(129, 236, 236, 0.7)";
      span.textContent = selectedText;
      range.deleteContents();
      range.insertNode(span);

      // Update tourStep for small condition
      if (tourStep === "introduce-small-condition") {
        setTourStep("selected-small-condition");
        sessionStorage.setItem("tourStep", "selected-small-condition");
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

      // Update selectedTypes with default "Text" for new condition
      const newTypes = [...selectedTypes, "Text"];
      setSelectedTypes(newTypes);
      sessionStorage.setItem("selectedQuestionTypes", JSON.stringify(newTypes));

      const fragment = document.createDocumentFragment();
      const contents = range.cloneContents();

      const applyHighlight = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const span = document.createElement("span");
          span.style.backgroundColor = isDarkMode ? "rgba(186, 220, 88, 0.5)" : "rgba(186, 220, 88, 0.7)";
          span.textContent = node.textContent;
          return span;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          const newElement = document.createElement(element.tagName);
          for (const attr of element.attributes) {
            newElement.setAttribute(attr.name, attr.value);
          }
          element.childNodes.forEach((child) => {
            const newChild = applyHighlight(child);
            if (newChild) {
              newElement.appendChild(newChild);
            }
          });
          return newElement;
        }
        return null;
      };
      contents.childNodes.forEach((node) => {
        const newNode = applyHighlight(node);
        if (newNode) {
          fragment.appendChild(newNode);
        }
      });

      range.deleteContents();
      range.insertNode(fragment);

      const probationClauseContent = "The first [Probation Period Length] of employment will be a probationary period. The Company shall assess the Employee’s performance and suitability during this time. Upon successful completion, the Employee will be confirmed in their role.";
      const pensionClauseContent = "The Employee will be enrolled in the Company’s pension scheme in accordance with auto-enrolment legislation.";

      const normalizeText = (text: string) => text.replace(/\s+/g, "");
      const normalizedSelectedText = normalizeText(textWithoutBrackets);
      const normalizedProbationClause = normalizeText(probationClauseContent);
      const normalizedPensionClause = normalizeText(pensionClauseContent);

      console.log("Normalized selectedText:", normalizedSelectedText);
      console.log("Normalized probationClause:", normalizedProbationClause);

      if (normalizedSelectedText === normalizedProbationClause) {
        console.log("Probation Clause matched, adding question instead of placeholder");
        addHighlightedText("Is the clause of probationary period applicable?");
        // Add "Text" type for the additional question
        const newTypesWithQuestion = [...newTypes, "Text"];
        setSelectedTypes(newTypesWithQuestion);
        sessionStorage.setItem("selectedQuestionTypes", JSON.stringify(newTypesWithQuestion));

        // Update tourStep for big condition with probation clause
        if (tourStep === "introduce-big-condition") {
          setTourStep("selected-big-condition");
          sessionStorage.setItem("tourStep", "selected-big-condition");
        }
      } else if (normalizedSelectedText === normalizedPensionClause) {
        console.log("Pension Clause matched, adding Pension question");
        addHighlightedText("Is the Pension clause applicable?");
        // Add "Text" type for the additional question
        const newTypesWithQuestion = [...newTypes, "Text"];
        setSelectedTypes(newTypesWithQuestion);
        sessionStorage.setItem("selectedQuestionTypes", JSON.stringify(newTypesWithQuestion));
      } else {
        console.log("No clause matched.");
      }
    } else if (label === "Loop") {
      addHighlightedText(textWithoutBrackets);

      // Update selectedTypes with default "Text" for new loop
      const newTypes = [...selectedTypes, "Text"];
      setSelectedTypes(newTypes);
      sessionStorage.setItem("selectedQuestionTypes", JSON.stringify(newTypes));

      const span = document.createElement("span");
      span.style.backgroundColor = isDarkMode ? "rgba(255, 245, 157, 0.5)" : "rgba(255, 245, 157, 0.7)";
      span.textContent = selectedText;
      range.deleteContents();
      range.insertNode(span);
    }
  };

  // Function to simulate clicking the Edit Placeholder button
  const simulateEditPlaceholderClick = () => {
    const editPlaceholderButton = document.querySelector("#edit-placeholder") as HTMLButtonElement;
    if (editPlaceholderButton) {
      editPlaceholderButton.click();
    }
  };

  // Function to simulate clicking the Small Condition button
  const simulateSmallConditionClick = () => {
    const smallConditionButton = document.querySelector("#icon-small-condition") as HTMLButtonElement;
    if (smallConditionButton) {
      smallConditionButton.click();
    }
  };

  // Function to simulate clicking the Big Condition button
  const simulateBigConditionClick = () => {
    const bigConditionButton = document.querySelector("#icon-big-condition") as HTMLButtonElement;
    if (bigConditionButton) {
      bigConditionButton.click();
    }
  };

  useEffect(() => {
    // Initialize the tour only once
    const tour = new Shepherd.Tour({
      defaultStepOptions: {
        cancelIcon: { enabled: true },
        classes: "shadow-md bg-purple-dark",
        scrollTo: { behavior: "smooth", block: "center" },
      },
      useModalOverlay: true,
      confirmCancel: false,
      tourName: `level-two-part-two-demo-${Date.now()}`,
    });

    tourRef.current = tour; // Store the tour instance

    // Step 1: Welcome
    tour.addStep({
      id: "welcome",
      text: `
        <div class="welcome-message">
          <strong class="welcome-title">🚀 Welcome to Part II of Level 2 Demo, brave document warrior!</strong>
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
            setTourStep("placeholders");
            sessionStorage.setItem("tourStep", "placeholders");
            tour.next();
          },
        },
      ],
    });

    // Step 1.1: Introduce Placeholders
    tour.addStep({
      id: "placeholders",
      text: "Behold your <strong>employment agreement!</strong> Notice those bits wrapped in square brackets, like <strong>[Employer Name]</strong>? Those are placeholders—your secret weapons for automation. Any text inside <strong>[square brackets]</strong> is a placeholder waiting to be customized.<br> Let's start with [Employer Name] by highlighting it and verifying your selection. Then, click on the 'Edit Placeholder' button to automate your placeholder.",
      attachTo: { element: document.body, on: "bottom-start" },
      buttons: [
        {
          text: "Next →",
          action: () => {
            setTourStep("select-employer-name");
            sessionStorage.setItem("tourStep", "select-employer-name");
            tour.next();
          },
        },
      ],
    });

    // Step 1.2: Select [Employer Name]
    tour.addStep({
      id: "select-employer-name",
      text: "Select <strong>[Employer Name]</strong> in the 'PARTIES' section (under 'Employer:') without spaces before or after the square brackets [].",
      attachTo: {
        element: (document.querySelector("#employer-name-placeholder") as HTMLElement | null) || document.body,
        on: "bottom",
      },
      buttons: [
        {
          text: "Verify Selection ✅",
          action: function () {
            const selection = window.getSelection();
            const selectedText = selection ? selection.toString().trim() : "";
            const employerNamePlaceholder = "[Employer Name]";

            if (selectedText === employerNamePlaceholder) {
              setTourStep("edit-placeholder-employer-name");
              sessionStorage.setItem("tourStep", "edit-placeholder-employer-name");
              tour.next();
            } else {
              alert("⚠️ Please select [Employer Name] exactly as shown in the 'PARTIES' section.");
            }
          },
        },
      ],
    });

    // Step 1.3: Click Edit Placeholder for [Employer Name]
    tour.addStep({
      id: "edit-placeholder-employer-name",
      text: "Now click on the <strong>Edit Placeholder</strong> button to automate [Employer Name].",
      attachTo: { element: "#edit-placeholder", on: "bottom" },
      buttons: [
        {
          text: "Next →",
          action: () => {
            simulateEditPlaceholderClick();
            setTourStep("selected-placeholder-employer-name");
            sessionStorage.setItem("tourStep", "selected-placeholder-employer-name");
            tour.next();
          },
        },
      ],
    });

    // Step 1.4: Confirm Placeholder Automation for [Employer Name]
    tour.addStep({
      id: "selected-placeholder-employer-name",
      text: "Your selected placeholder <strong>[Employer Name]</strong> is now visible here 📌 and ready for editing.",
      attachTo: { element: "#selected-placeholder0", on: "bottom" },
      buttons: [
        {
          text: "Next →",
          action: () => {
            setTourStep("questionnaire-employer-name");
            sessionStorage.setItem("tourStep", "questionnaire-employer-name");
            tour.next();
          },
        },
      ],
    });

    // Step 1.5: Navigate to Questionnaire for [Employer Name]
    tour.addStep({
      id: "questionnaire-employer-name",
      text: "Now that you've selected the [Employer Name] placeholder, let's bring it to life. Head to the 'Questionnaire' page to draft a question for this placeholder. Click <strong>'Questionnaire'</strong> in the menu bar to proceed!",
      attachTo: { element: "#Questionnaire-button", on: "right" },
      buttons: [
        {
          text: "Go to Questionnaire →",
          action: () => {
            setTourStep("return-from-questionnaire-employer-name");
            sessionStorage.setItem("tourStep", "return-from-questionnaire-employer-name");
            navigate("/Questionnaire");
          },
        },
      ],
    });

    // Step 1.6: AI Feedback for [Employer Name] (after returning from Questionnaire)
    tour.addStep({
      id: "return-from-questionnaire-employer-name",
      text: "Great job! You successfully automated the <strong>[Employer Name]</strong> placeholder. Let's move on to the next placeholder.",
      attachTo: { element: "#selected-placeholder0", on: "bottom" },
      buttons: [
        {
          text: "Next →",
          action: () => {
            setTourStep("introduce-employee-name");
            sessionStorage.setItem("tourStep", "introduce-employee-name");
            tour.next();
          },
        },
      ],
    });

    // Step 2: Automating Placeholders - [Employee Name] and [Agreement Date]
    // Step 2.1: Introduce [Employee Name]
    tour.addStep({
      id: "introduce-employee-name",
      text: "Next, let's automate another placeholder. Select <strong>[Employee Name]</strong> in the 'PARTIES' section (under 'Employee:') without spaces before or after the square brackets [].",
      attachTo: {
        element: (document.querySelector("#employee-name-placeholder") as HTMLElement | null) || document.body,
        on: "bottom",
      },
      buttons: [
        {
          text: "Verify Selection ✅",
          action: function () {
            const selection = window.getSelection();
            const selectedText = selection ? selection.toString().trim() : "";
            const employeeNamePlaceholder = "[Employee Name]";

            if (selectedText === employeeNamePlaceholder) {
              setTourStep("edit-placeholder-employee-name");
              sessionStorage.setItem("tourStep", "edit-placeholder-employee-name");
              tour.next();
            } else {
              alert("⚠️ Please select [Employee Name] exactly as shown in the 'PARTIES' section.");
            }
          },
        },
      ],
    });

    // Step 2.2: Click Edit Placeholder for [Employee Name]
    tour.addStep({
      id: "edit-placeholder-employee-name",
      text: "Now click on the <strong>Edit Placeholder</strong> button to automate [Employee Name].",
      attachTo: { element: "#edit-placeholder", on: "bottom" },
      buttons: [
        {
          text: "Next →",
          action: () => {
            simulateEditPlaceholderClick();
            setTourStep("selected-placeholder-employee-name");
            sessionStorage.setItem("tourStep", "selected-placeholder-employee-name");
            tour.next();
          },
        },
      ],
    });

    // Step 2.3: Confirm Placeholder Automation for [Employee Name]
    tour.addStep({
      id: "selected-placeholder-employee-name",
      text: "Your selected placeholder <strong>[Employee Name]</strong> is now visible here 📌 and ready for editing.",
      attachTo: { element: "#selected-placeholder1", on: "bottom" },
      buttons: [
        {
          text: "Next →",
          action: () => {
            setTourStep("introduce-agreement-date");
            sessionStorage.setItem("tourStep", "introduce-agreement-date");
            tour.next();
          },
        },
      ],
    });

    // Step 2.4: Introduce [Agreement Date]
    tour.addStep({
      id: "introduce-agreement-date",
      text: "Let's automate one more placeholder. Select <strong>[Agreement Date]</strong> in the 'PARTIES' section (at the end of the section) without spaces before or after the square brackets [].",
      attachTo: {
        element: (document.querySelector("#agreement-date-placeholder") as HTMLElement | null) || document.body,
        on: "bottom",
      },
      buttons: [
        {
          text: "Verify Selection ✅",
          action: function () {
            const selection = window.getSelection();
            const selectedText = selection ? selection.toString().trim() : "";
            const agreementDatePlaceholder = "[Agreement Date]";

            if (selectedText === agreementDatePlaceholder) {
              setTourStep("edit-placeholder-agreement-date");
              sessionStorage.setItem("tourStep", "edit-placeholder-agreement-date");
              tour.next();
            } else {
              alert("⚠️ Please select [Agreement Date] exactly as shown in the 'PARTIES' section.");
            }
          },
        },
      ],
    });

    // Step 2.5: Click Edit Placeholder for [Agreement Date]
    tour.addStep({
      id: "edit-placeholder-agreement-date",
      text: "Now click on the <strong>Edit Placeholder</strong> button to automate [Agreement Date].",
      attachTo: { element: "#edit-placeholder", on: "bottom" },
      buttons: [
        {
          text: "Next →",
          action: () => {
            simulateEditPlaceholderClick();
            setTourStep("selected-placeholder-agreement-date");
            sessionStorage.setItem("tourStep", "selected-placeholder-agreement-date");
            tour.next();
          },
        },
      ],
    });

    // Step 2.6: Confirm Placeholder Automation for [Agreement Date]
    tour.addStep({
      id: "selected-placeholder-agreement-date",
      text: "Your selected placeholder <strong>[Agreement Date]</strong> is now visible here 📌 and ready for editing.",
      attachTo: { element: "#selected-placeholder2", on: "bottom" },
      buttons: [
        {
          text: "Next →",
          action: () => {
            setTourStep("questionnaire-employee-name-agreement-date");
            sessionStorage.setItem("tourStep", "questionnaire-employee-name-agreement-date");
            tour.next();
          },
        },
      ],
    });

    // Step 2.7: Navigate to Questionnaire for [Employee Name] and [Agreement Date]
    tour.addStep({
      id: "questionnaire-employee-name-agreement-date",
      text: "You've selected <strong>[Employee Name]</strong> and <strong>[Agreement Date]</strong>. Let's draft questions for these placeholders. Head to the 'Questionnaire' page by clicking <strong>'Questionnaire'</strong> in the menu bar.",
      attachTo: { element: "#Questionnaire-button", on: "right" },
      buttons: [
        {
          text: "Go to Questionnaire →",
          action: () => {
            setTourStep("return-from-questionnaire-employee-name-agreement-date");
            sessionStorage.setItem("tourStep", "return-from-questionnaire-employee-name-agreement-date");
            navigate("/Questionnaire");
          },
        },
      ],
    });

    // Step 2.8: AI Feedback for [Employee Name] and [Agreement Date]
    tour.addStep({
      id: "return-from-questionnaire-employee-name-agreement-date",
      text: "Great job! You successfully automated the placeholders <strong>[Employee Name]</strong> and <strong>[Agreement Date]</strong>! Let's move on to automating conditions.",
      attachTo: { element: "#selected-placeholder2", on: "bottom" },
      buttons: [
        {
          text: "Next →",
          action: () => {
            setTourStep("introduce-small-condition");
            sessionStorage.setItem("tourStep", "introduce-small-condition");
            tour.next();
          },
        },
      ],
    });

    // Step 3: Automating a Small Condition - {Overtime Pay Clause}
    // Step 3.1: Introduce Small Condition
    tour.addStep({
      id: "introduce-small-condition",
      text: "Now let's automate a small condition. Conditions wrapped in <strong>{curly braces}</strong> can be toggled on or off. Select <strong>{The Employee is entitled to overtime pay for authorized overtime work.}</strong> in the 'WORKING HOURS' section.",
      attachTo: {
        element: (document.querySelector("#employment-agreement-working-hours") as HTMLElement | null) || document.body,
        on: "bottom",
      },
      buttons: [
        {
          text: "Verify Selection ✅",
          action: function () {
            const selection = window.getSelection();
            const selectedText = selection ? selection.toString().trim() : "";
            const overtimePayClause = "{The Employee is entitled to overtime pay for authorized overtime work.}";

            if (selectedText === overtimePayClause) {
              setTourStep("small-condition-button");
              sessionStorage.setItem("tourStep", "small-condition-button");
              tour.next();
            } else {
              alert("⚠️ Please select {The Employee is entitled to overtime pay for authorized overtime work.} exactly as shown in the 'WORKING HOURS' section.");
            }
          },
        },
      ],
    });

    // Step 3.2: Click Small Condition Button
    tour.addStep({
      id: "small-condition-button",
      text: "Now click on the <strong>Small Condition</strong> button to automate this condition.",
      attachTo: { element: "#icon-small-condition", on: "bottom" },
      buttons: [
        {
          text: "Next →",
          action: () => {
            simulateSmallConditionClick();
            setTourStep("selected-small-condition");
            sessionStorage.setItem("tourStep", "selected-small-condition");
            tour.next();
          },
        },
      ],
    });

    // Step 3.3: Confirm Small Condition Automation
    tour.addStep({
      id: "selected-small-condition",
      text: "Your selected condition <strong>{The Employee is entitled to overtime pay for authorized overtime work.}</strong> is now visible here 📌 and ready for editing.",
      attachTo: { element: "#selected-placeholder3", on: "bottom" },
      buttons: [
        {
          text: "Next →",
          action: () => {
            setTourStep("questionnaire-small-condition");
            sessionStorage.setItem("tourStep", "questionnaire-small-condition");
            tour.next();
          },
        },
      ],
    });

    // Step 3.4: Navigate to Questionnaire for Small Condition
    tour.addStep({
      id: "questionnaire-small-condition",
      text: "Let's draft a question for this condition. Head to the 'Questionnaire' page by clicking <strong>'Questionnaire'</strong> in the menu bar to create a question like 'Would the employee be entitled to overtime pay?'.",
      attachTo: { element: "#Questionnaire-button", on: "right" },
      buttons: [
        {
          text: "Go to Questionnaire →",
          action: () => {
            setTourStep("return-from-questionnaire-small-condition");
            sessionStorage.setItem("tourStep", "return-from-questionnaire-small-condition");
            navigate("/Questionnaire");
          },
        },
      ],
    });

    // Step 3.5: AI Feedback for Small Condition
    tour.addStep({
      id: "return-from-questionnaire-small-condition",
      text: "Good job automating the small condition <strong>{The Employee is entitled to overtime pay for authorized overtime work.}</strong>! Let's move on to a big condition.",
      attachTo: { element: "#selected-placeholder3", on: "bottom" },
      buttons: [
        {
          text: "Next →",
          action: () => {
            setTourStep("introduce-big-condition");
            sessionStorage.setItem("tourStep", "introduce-big-condition");
            tour.next();
          },
        },
      ],
    });

    // Step 4: Automating a Big Condition - (Probationary Period Clause)
    // Step 4.1: Introduce Big Condition
    tour.addStep({
      id: "introduce-big-condition",
      text: "Now let's automate a big condition. Conditions wrapped in <strong>(parentheses)</strong> can include entire sections. Select the entire <strong>(PROBATIONARY PERIOD...)</strong> section, including the heading and paragraph, under the 'PROBATIONARY PERIOD' section.",
      attachTo: {
        element: (document.querySelector("#employment-agreement-probationary-period") as HTMLElement | null) || document.body,
        on: "bottom",
      },
      buttons: [
        {
          text: "Verify Selection ✅",
          action: function () {
            const selection = window.getSelection();
            const selectedText = selection ? selection.toString().trim() : "";
            const probationaryPeriodClauseStart = "(PROBATIONARY PERIOD";
            const probationaryPeriodClauseEnd = "confirmed in their role.)";

            if (selectedText.startsWith(probationaryPeriodClauseStart) && selectedText.endsWith(probationaryPeriodClauseEnd)) {
              setTourStep("big-condition-button");
              sessionStorage.setItem("tourStep", "big-condition-button");
              tour.next();
            } else {
              alert("⚠️ Please select the entire (PROBATIONARY PERIOD...) section, including the heading and paragraph.");
            }
          },
        },
      ],
    });

    // Step 4.2: Click Big Condition Button
    tour.addStep({
      id: "big-condition-button",
      text: "Now click on the <strong>Big Condition</strong> button to automate this section.",
      attachTo: { element: "#icon-big-condition", on: "bottom" },
      buttons: [
        {
          text: "Next →",
          action: () => {
            simulateBigConditionClick();
            setTourStep("selected-big-condition");
            sessionStorage.setItem("tourStep", "selected-big-condition");
            tour.next();
          },
        },
      ],
    });

    // Step 4.3: Confirm Big Condition Automation
    tour.addStep({
      id: "selected-big-condition",
      text: "Your selected condition <strong>(PROBATIONARY PERIOD...)</strong> is now visible here 📌. Notice that an additional question 'Is the clause of probationary period applicable?' has been automatically added.",
      attachTo: { element: "#selected-placeholder4", on: "bottom" },
      buttons: [
        {
          text: "Next →",
          action: () => {
            setTourStep("questionnaire-big-condition");
            sessionStorage.setItem("tourStep", "questionnaire-big-condition");
            tour.next();
          },
        },
      ],
    });

    // Step 4.4: Navigate to Questionnaire for Big Condition
    tour.addStep({
      id: "questionnaire-big-condition",
      text: "Let's draft a question for this condition. Head to the 'Questionnaire' page by clicking <strong>'Questionnaire'</strong> in the menu bar to create a question like 'Is the clause of probationary period included?'.",
      attachTo: { element: "#Questionnaire-button", on: "right" },
      buttons: [
        {
          text: "Go to Questionnaire →",
          action: () => {
            setTourStep("return-from-questionnaire-big-condition");
            sessionStorage.setItem("tourStep", "return-from-questionnaire-big-condition");
            navigate("/Questionnaire");
          },
        },
      ],
    });

    // Step 4.5: AI Feedback for Big Condition
    tour.addStep({
      id: "return-from-questionnaire-big-condition",
      text: "Well done! You've automated the complex condition <strong>(PROBATIONARY PERIOD...)</strong>. You've completed the automation tasks for Level 2 Part II Demo!",
      attachTo: { element: "#selected-placeholder4", on: "bottom" },
      buttons: [
        {
          text: "Finish →",
          action: () => {
            setTourStep(null);
            sessionStorage.removeItem("tourStep");
            tour.complete();
          },
        },
      ],
    });

    // Start or resume the tour based on the tourStep state
    if (tourStep) {
      tour.start();
      tour.show(tourStep);
    }

    // Cleanup on unmount
    return () => {
      if (tourRef.current) {
        tourRef.current.complete();
      }
    };
  }, [navigate]); // Removed highlightedTexts and selectedTypes from dependencies

  return (
    <div
      className={`w-full min-h-screen font-sans transition-all duration-500 ${
        isDarkMode
          ? "bg-gradient-to-br from-gray-800 via-gray-900 to-black"
          : "bg-gradient-to-br from-indigo-50 via-teal-50 to-pink-50"
      }`}
    >
      <Navbar
        level={"/Level-Two-Part-Two-Demo"}
        questionnaire={"/Questionnaire"}
        live_generation={"/Live_Generation"}
      />
      <div className="fixed flex top-16 right-0 z-50 px-6 py-3 space-x-6">
        {icons.map(({ icon, label }, index) => (
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
        ))}
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
                      ? "Campus Recruitmenttext-teal-200 bg-gray-600/80 hover:bg-gray-500/70"
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
          className={`p-6 rounded-3xl shadow-xl border ${
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
      </div>
    </div>
  );
};

export default LevelTwoPart_Two_Demo;
