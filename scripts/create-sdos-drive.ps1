param(
  [string]$Root = "C:\SchoolyTestDrive",
  [string]$AcademicYear = "AY 2026-27",
  [string]$ConfigPath = "",
  [switch]$WithSampleFiles
)

Set-Culture "en-US" -ErrorAction SilentlyContinue

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "      SCHOOL DIGITAL OPERATING SYSTEM DRIVE GENERATOR     " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# ------------------------------------------------------------------------------
# PATH SAFETY UTILITY FUNCTION
# ------------------------------------------------------------------------------
function ConvertTo-SafePathName {
    param([string]$Name)
    if ([string]::IsNullOrEmpty($Name)) {
        return "unnamed"
    }
    # Invalid Windows path characters: < > : " / \ | ? *
    $Safe = $Name
    $InvalidChars = @("<", ">", ":", '"', "/", "\", "|", "?", "*")
    foreach ($Char in $InvalidChars) {
        $Safe = $Safe.Replace($Char, "")
    }
    # Remove terminating trailing periods or space variations that degrade path safety on Windows
    $Safe = $Safe.Trim().TrimEnd('.')
    if ($Safe.Length -eq 0) {
        $Safe = "unnamed"
    }
    return $Safe
}

# ------------------------------------------------------------------------------
# STANDARD SAMPLE CONTENT GENERATION UTILITY
# ------------------------------------------------------------------------------
function Get-SampleContent {
    param(
        [string]$Class,
        [string]$Subject,
        [string]$FileType, # 'readme', 'lesson', 'quiz', 'assignment', 'bank', 'rubric'
        [string]$Sec
    )

    $IsPrePrimary = ($Class -eq "Nursery" -or $Class -eq "Kindergarten" -or $Class -match "Pre-Primary" -or $Class -match "Grade [K12]")
    $IsPE = ($Subject -match "Physical" -or $Subject -match "Fitness" -or $Subject -match "Athletics")

    if ($FileType -eq 'readme') {
        if ($IsPrePrimary) {
            return "This directory hosts fundamental motor and early developmental learning resources for early childhood stage $Class, section $Sec.`n`nOwner: academic.repository"
        } elseif ($IsPE) {
            return "This directory hosts physical fitness coordination, outdoor sport guidelines, and personal wellness schedules for Class $Class, section $Sec.`n`nOwner: academic.repository"
        } else {
            return "This directory hosts validated curriculum planning files for Academic Stage classes under $Class, section $Sec.`n`nOwner: academic.repository"
        }
    }
    
    if ($FileType -eq 'lesson') {
        if ($IsPrePrimary) {
            return "### Early Childhood Learning Objectives`n- Identify fundamental colors and select numbers 1 to 10.`n- Perform basic finger-painting and group sharing circle activities.`n`nPedagogical method: Play-based experiential learning."
        } elseif ($IsPE) {
            return "### Health and Movement Lesson Plan`n- Core Objective: Understand correct posture, aerobic mobility exercises, and warm-up routines.`n- Activity: Staged cardiovascular exercises, basic athletics drills, followed by cooling down breathing tasks."
        } elseif ($Subject -eq "Mathematics" -or $Subject -eq "Pre-Algebra" -or $Subject -eq "Calculus") {
            return "### Quantitative Reasoning Lesson Plan`n- Core Objective: Deconstruct algebraic steps or numerical operations.`n- Activity: Step-by-step whiteboard demonstrations, student peer-led practice loops, and targeted equation solving."
        } else {
            return "### Standard Lesson Blueprint`n- Core Objective: Introduce fundamental principles of $Subject.`n- Activity: Concept introduction, core analytical reading, followed by active discussion boards or summary drafting."
        }
    }

    if ($FileType -eq 'quiz') {
        if ($IsPrePrimary) {
            return "### Playful Interactive Action Check`n1. Look at the cards: point to the red square and trace the circular shape.`n2. Clap your hands slowly as we count up from 1 to 5 together."
        } elseif ($IsPE) {
            return "### Fitness Assessment Tracker`n1. List three main parts of a proper warm-up routine.`n2. Why is hydration highly critical during intensive athletics practice?"
        } elseif ($Subject -eq "Mathematics" -or $Subject -eq "Pre-Algebra" -or $Subject -eq "Calculus") {
            return "### Diagnostic Formative Math Quiz`n1. Solve the following equation for the main variable: x + 7 = 15.`n2. Explain the fundamental theorem or mathematical rule introduced today."
        } else {
            return "### Formative Assessment Bank`n1. Explain the main concept or primary thesis in today's lesson on $Subject.`n2. Name two real-world applications of this theoretical model."
        }
    }

    if ($FileType -eq 'assignment') {
        if ($IsPrePrimary) {
            return "### Family-Assisted Reading & Drawing`nDraw your favorite domestic animal using crayons, and count its legs with a parent's assistance. Bring your drawing to Class on Friday!"
        } elseif ($IsPE) {
            return "### Daily Movement Log`nComplete a 15-minute standard walking or stretching session after school, and record your feelings of energy before and after the session in your personal physical education logbook."
        } else {
            return "### Analytical Essay Assignment`nDraft a structured study or summary (approximately 500 words) discussing contemporary applications of $Subject. Ensure you outline two references or real-world case studies."
        }
    }

    if ($FileType -eq 'bank') {
        if ($IsPrePrimary) {
            return "### Pre-Primary Developmental Milestones Checkpad`n- Assessment of fine-motor abilities during craft cutting.`n- Assessment of social sharing and basic communicative responses in team play."
        } elseif ($IsPE) {
            return "### Dynamic Movement & Health Questions Bank`n- Formative rubric points on core team participation.`n- Safety checks evaluation checklist during physical education sessions."
        } else {
            return "### Academic High-Order Questioning Bank`n- Section A: Conceptual definition checks (20%).`n- Section B: Direct application and reasoning problems (50%).`n- Section C: High-order thinking skills and case analysis (30%)."
        }
    }

    if ($FileType -eq 'rubric') {
        if ($IsPrePrimary) {
            return "### Fine-Motor & Social Development Rubric`n- Participation & Sharing (40%)`n- Creative Expression (30%)`n- Cognitive Recognition & Action (30%)`n`nTotal = 100%."
        } elseif ($IsPE) {
            return "### Teamwork & Skill Execution Rubric`n- Form & Movement Safety (40%)`n- Effort & Group Coordination (30%)`n- Skill Demonstration Depth (30%)`n`nTotal = 100%."
        } else {
            return "### Standard Academic Evaluation Rubric`n- Accuracy & Factuality (40%)`n- Conceptual Depth & Application (30%)`n- Critical Analysis & References (30%)`n`nTotal = 100%."
        }
    }

    return "Sample files structured."
}

# ------------------------------------------------------------------------------
# DEFAULT FALLBACK CBSE CONFIGURATION PARAMETERS
# ------------------------------------------------------------------------------
$SchoolName = "Demo Public School"
$SchoolCode = "DEMO-CBSE-001"
$Curriculum = "CBSE"
$SelectedAcademicYear = $AcademicYear
$Sections = @("A", "B", "C", "D")

$InstitutionalIdentities = [ordered]@{
    "academicRepository" = "academic.repository"
    "governance"         = "principal"
    "classroomAdmin"     = "classroomadmin"
}

$Stages = @("Pre-Primary", "Primary", "Middle", "Secondary", "Senior Secondary")

$StageClasses = [ordered]@{
    "Pre-Primary"      = @("Nursery", "Kindergarten")
    "Primary"          = @("Class I", "Class II", "Class III", "Class IV", "Class V")
    "Middle"           = @("Class VI", "Class VII", "Class VIII")
    "Secondary"        = @("Class IX", "Class X")
    "Senior Secondary" = @("Class XI", "Class XII")
}

$StageSubjects = [ordered]@{
    "Pre-Primary"      = @("English", "Hindi", "Numeracy", "Environmental Awareness", "Art and Craft", "Music and Movement", "Physical Development")
    "Primary"          = @("English", "Hindi", "Mathematics", "Environmental Studies", "Computer Science", "Art and Craft", "Music", "Physical Education")
    "Middle"           = @("English", "Hindi", "Mathematics", "Science", "Social Science", "Sanskrit", "Computer Science", "Art Education", "Physical Education")
    "Secondary"        = @("English", "Hindi", "Mathematics", "Science", "Social Science", "Information Technology", "Artificial Intelligence", "Physical Education")
    "Senior Secondary" = @("English", "Physics", "Chemistry", "Mathematics", "Biology", "Computer Science", "Economics", "Business Studies", "Accountancy", "Political Science", "History", "Psychology", "Physical Education")
}

$SubjectArtifactFolders = @(
    "01_Annual_Planning",
    "02_Chapter_Resources",
    "03_Assessments",
    "04_Projects",
    "05_Remedial",
    "06_Enrichment",
    "07_Teacher_Resources"
)

$GovFolders = @(
    "01_Compliance",
    "02_Academic_Audit",
    "03_HR",
    "05_Dashboard_Data",
    "06_SOPs",
    "07_Strategic_Planning",
    "08_Meeting_Minutes",
    "09_School_Improvement_Plans",
    "10_Committee_Records",
    "11_Policies"
)

$Forms = @(
    "01_Weekly_Planner_Form",
    "02_Notebook_Monitoring_Form",
    "03_Assessment_Status_Form",
    "04_Remedial_Tracking_Form",
    "05_Event_Reporting_Form",
    "06_Compliance_Evidence_Form"
)

$ServiceAccounts = @("academic.repository", "principal", "classroomadmin", "erp", "transport", "website")

$DeptGroupsList = @(
    "english.department@",
    "hindi.department@",
    "mathematics.department@",
    "science.department@",
    "sst.department@",
    "computer.department@"
)

$TeacherGroupsList = @(
    "allteachers@",
    "preprimary.teachers@",
    "primary.teachers@",
    "middle.teachers@",
    "secondary.teachers@",
    "seniorsecondary.teachers@"
)

$StandardClassroomTopics = @(
    "$([System.Char]::ConvertFromUtf32(0x1F4CC)) Important Announcements",
    "$([System.Char]::ConvertFromUtf32(0x1F4C5)) Weekly Planner",
    "$([System.Char]::ConvertFromUtf32(0x1F4D8)) English",
    "$([System.Char]::ConvertFromUtf32(0x1F4D7)) Hindi",
    "$([System.Char]::ConvertFromUtf32(0x1F4D9)) Mathematics",
    "$([System.Char]::ConvertFromUtf32(0x1F4D5)) Science",
    "$([System.Char]::ConvertFromUtf32(0x1F4D3)) Social Science",
    "$([System.Char]::ConvertFromUtf32(0x1F4D2)) Computer / AI",
    "$([System.Char]::ConvertFromUtf32(0x1F4DD)) Homework & Practice",
    "$([System.Char]::ConvertFromUtf32(0x1F4DA)) Assessments & Tests",
    "$([System.Char]::ConvertFromUtf32(0x1F3AF)) Remedial Support",
    "$([System.Char]::ConvertFromUtf32(0x1F3C6)) Enrichment & Olympiads",
    "$([System.Char]::ConvertFromUtf32(0x1F4C2)) Study Materials",
    "$([System.Char]::ConvertFromUtf32(0x1F4D6)) Holiday Homework",
    "$([System.Char]::ConvertFromUtf32(0x1F393)) Examination Resources",
    "$([System.Char]::ConvertFromUtf32(0x1F4CB)) Notebook / Project Guidelines",
    "$([System.Char]::ConvertFromUtf32(0x1F4AC)) Counselling & Wellbeing"
)

$ConfigSource = "Safe CBSE Fallback Defaults"

# ------------------------------------------------------------------------------
# LOAD CONFIGURATION VIA CONFIGPATH IF PROVIDED
# ------------------------------------------------------------------------------
if (![string]::IsNullOrEmpty($ConfigPath)) {
    if (Test-Path -Path $ConfigPath) {
        Write-Host "[CONFIG] Loading JSON configuration: $ConfigPath" -ForegroundColor Magenta
        try {
            $RawJson = Get-Content -Raw -Path $ConfigPath | ConvertFrom-Json
            
            if ($RawJson.schoolName) { $SchoolName = $RawJson.schoolName }
            if ($RawJson.schoolCode) { $SchoolCode = $RawJson.schoolCode }
            if ($RawJson.curriculum) { $Curriculum = $RawJson.curriculum }
            if ($RawJson.academicYear) { $SelectedAcademicYear = $RawJson.academicYear }
            if ($RawJson.sections) { $Sections = $RawJson.sections }
            
            if ($RawJson.institutionalIdentities) {
                # Convert deserialized PSCustomObject to [ordered] hashtable
                $InstitutionalIdentities = [ordered]@{}
                foreach ($Property in $RawJson.institutionalIdentities.psobject.properties) {
                    $InstitutionalIdentities[$Property.Name] = $Property.Value
                }
            }
            
            if ($RawJson.stages) {
                # Overwrite standard stages with config stages
                $Stages = $RawJson.stages | ForEach-Object { $_.name }
                $StageClasses = [ordered]@{}
                $StageSubjects = [ordered]@{}
                foreach ($StageObj in $RawJson.stages) {
                    $StageClasses[$StageObj.name] = $StageObj.classes
                    $StageSubjects[$StageObj.name] = $StageObj.subjects
                }
            }
            
            if ($RawJson.artifactFolders) { $SubjectArtifactFolders = $RawJson.artifactFolders }
            if ($RawJson.governanceFolders) { $GovFolders = $RawJson.governanceFolders }
            if ($RawJson.formsIntake) { $Forms = $RawJson.formsIntake }
            if ($RawJson.serviceAccounts) { $ServiceAccounts = $RawJson.serviceAccounts }
            if ($RawJson.departmentGroups) { $DeptGroupsList = $RawJson.departmentGroups }
            if ($RawJson.teacherGroups) { $TeacherGroupsList = $RawJson.teacherGroups }
            
            $ConfigSource = $ConfigPath
            Write-Host "[CONFIG] Configuration parsed and validated successfully." -ForegroundColor Green
        }
        catch {
            Write-Host "[ERR] Failed to parse JSON config: $_. Fallback defaults will be enforced." -ForegroundColor Red
        }
    } else {
        Write-Host "[WARN] Configuration path '$ConfigPath' not found. Using safe fallbacks." -ForegroundColor Yellow
    }
} else {
    Write-Host "[CONFIG] Using fallback CBSE metadata template rules." -ForegroundColor DarkGray
}

Write-Host "----------------------------------------------------------"
Write-Host "Target School Name: $SchoolName" -ForegroundColor Yellow
Write-Host "Target School Code: $SchoolCode" -ForegroundColor Yellow
Write-Host "Target Curriculum : $Curriculum" -ForegroundColor Yellow
Write-Host "Generation Path   : $Root" -ForegroundColor Yellow
Write-Host "Academic Year     : $SelectedAcademicYear" -ForegroundColor Yellow
Write-Host "With Sample Files : $WithSampleFiles" -ForegroundColor Yellow
Write-Host "Configuration Src : $ConfigSource" -ForegroundColor Yellow
Write-Host "----------------------------------------------------------"

# Ensure the root path exists
if (!(Test-Path -Path $Root)) {
    New-Item -ItemType Directory -Path $Root -Force | Out-Null
    Write-Host "[INIT] Created school digital drive root path." -ForegroundColor Green
} else {
    Write-Host "[INIT] Root path already exists. Proceeding in safe update status." -ForegroundColor Gray
}

# HELPER: Idempotent Directory Maker with Safe Path Normalized Casing
function New-Dir {
    param([string]$Path)
    if (!(Test-Path -Path $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

# HELPER: Idempotent Markdown Creator
function New-Doc {
    param([string]$Path, [string]$Title, [string]$Content)
    if (!(Test-Path -Path $Path)) {
        $DocContent = "# $Title`r`n`r`n$Content"
        Set-Content -Path $Path -Value $DocContent -Encoding UTF8 -Force
    }
}

# ==============================================================================
# WORLD 1: ACADEMIC REPOSITORY
# ==============================================================================
$SafeAcademicRepositoryRoot = ConvertTo-SafePathName "Academic Repository"
Write-Host "[WORLD 1] Constructing Academic Knowledge Base Repository under '$SafeAcademicRepositoryRoot'..." -ForegroundColor Cyan

$AcademicRepositoryRoot = Join-Path -Path $Root -ChildPath $SafeAcademicRepositoryRoot
$SafeYear = ConvertTo-SafePathName $SelectedAcademicYear
$YearRoot = Join-Path -Path $AcademicRepositoryRoot -ChildPath $SafeYear

New-Dir $AcademicRepositoryRoot
New-Dir $YearRoot

foreach ($Stage in $Stages) {
    $SafeStage = ConvertTo-SafePathName $Stage
    Write-Host "  > Building Curriculum Stage: $SafeStage..." -ForegroundColor DarkGray
    $StagePath = Join-Path -Path $YearRoot -ChildPath $SafeStage
    New-Dir $StagePath

    $ClassesInStage = $StageClasses[$Stage]
    $SubjectsInStage = $StageSubjects[$Stage]

    foreach ($Class in $ClassesInStage) {
        $SafeClass = ConvertTo-SafePathName $Class
        $ClassPath = Join-Path -Path $StagePath -ChildPath $SafeClass
        New-Dir $ClassPath

        # For every class, create normalized section folders
        foreach ($Sec in $Sections) {
            $SafeSec = ConvertTo-SafePathName $Sec
            $SectionName = "$SafeClass-$SafeSec"
            $SectionPath = Join-Path -Path $ClassPath -ChildPath $SectionName
            New-Dir $SectionPath

            foreach ($Subject in $SubjectsInStage) {
                $SafeSubject = ConvertTo-SafePathName $Subject
                $SubjectPath = Join-Path -Path $SectionPath -ChildPath $SafeSubject
                New-Dir $SubjectPath

                foreach ($Folder in $SubjectArtifactFolders) {
                    $SafeFolder = ConvertTo-SafePathName $Folder
                    $FolderPath = Join-Path -Path $SubjectPath -ChildPath $SafeFolder
                    New-Dir $FolderPath

                    # Generate sample resources inside 02_Chapter_Resources (or similar second item)
                    if ($WithSampleFiles -and ($SafeFolder -match "02_Chapter_Resources" -or $SafeFolder -match "Lessons")) {
                        $SampleChPath = Join-Path -Path $FolderPath -ChildPath "Ch01_Sample_Chapter"
                        New-Dir $SampleChPath

                        # Populate standard markdown files
                        New-Doc -Path (Join-Path -Path $SampleChPath -ChildPath "README.md") `
                                -Title "Chapter 1: Foundations of $Subject" `
                                -Content (Get-SampleContent -Class $Class -Subject $Subject -FileType "readme" -Sec $Sec)

                        New-Doc -Path (Join-Path -Path $SampleChPath -ChildPath "sample_lesson_plan.md") `
                                -Title "$Subject - Lesson Plan Standard Blueprint" `
                                -Content (Get-SampleContent -Class $Class -Subject $Subject -FileType "lesson" -Sec $Sec)

                        New-Doc -Path (Join-Path -Path $SampleChPath -ChildPath "sample_quiz.md") `
                                -Title "Diagnostic Formative Assessment Bank" `
                                -Content (Get-SampleContent -Class $Class -Subject $Subject -FileType "quiz" -Sec $Sec)

                        New-Doc -Path (Join-Path -Path $SampleChPath -ChildPath "sample_assignment.md") `
                                -Title "Classroom Summative Project & Guidelines" `
                                -Content (Get-SampleContent -Class $Class -Subject $Subject -FileType "assignment" -Sec $Sec)

                        New-Doc -Path (Join-Path -Path $SampleChPath -ChildPath "sample_assessment_bank.md") `
                                -Title "Standard Assessment Bank - Academic Year Core" `
                                -Content (Get-SampleContent -Class $Class -Subject $Subject -FileType "bank" -Sec $Sec)

                        New-Doc -Path (Join-Path -Path $SampleChPath -ChildPath "sample_rubric.md") `
                                -Title "Evaluation Scale & Assessment Rubric Document" `
                                -Content (Get-SampleContent -Class $Class -Subject $Subject -FileType "rubric" -Sec $Sec)
                    }
                }
            }
        }
    }
}

# ==============================================================================
# WORLD 2: SCHOOL GOVERNANCE
# ==============================================================================
$SafeGovernanceRoot = ConvertTo-SafePathName "School Governance"
Write-Host "[WORLD 2] Launching Executive Leadership & Auditing Structures under '$SafeGovernanceRoot'..." -ForegroundColor Cyan

$GovernanceRoot = Join-Path -Path $Root -ChildPath $SafeGovernanceRoot
New-Dir $GovernanceRoot

foreach ($Folder in $GovFolders) {
    $SafeFolder = ConvertTo-SafePathName $Folder
    New-Dir (Join-Path -Path $GovernanceRoot -ChildPath $SafeFolder)
}

# Governance subfolders for Dashboard Data
$SafeDashboardData = ConvertTo-SafePathName "05_Dashboard_Data"
$DashboardDataRoot = Join-Path -Path $GovernanceRoot -ChildPath $SafeDashboardData

$DashboardModules = @(
    "Academic Monitoring",
    "Weekly Planner Status",
    "Syllabus Coverage",
    "Assessment Completion",
    "Notebook Monitoring",
    "Classroom Monitoring",
    "Compliance",
    "Teacher Performance Indicators",
    "Resource Contributions"
)

# Standardized fallback if directory exists
if (Test-Path -Path $DashboardDataRoot) {
    foreach ($Module in $DashboardModules) {
        $SafeModule = ConvertTo-SafePathName $Module
        $ModulePath = Join-Path -Path $DashboardDataRoot -ChildPath $SafeModule
        New-Dir $ModulePath
        New-Doc -Path (Join-Path -Path $ModulePath -ChildPath "monitoring_ledger.md") `
                -Title "$Module Registry Log" `
                -Content "Main governance surveillance indicators ledger for the Principal and District coordinators.`n`nOwner: principal"
    }
}

# ==============================================================================
# WORLD 3: GOOGLE CLASSROOM TEMPLATES
# ==============================================================================
$SafeClassroomTemplatesRoot = ConvertTo-SafePathName "Google Classroom Templates"
Write-Host "[WORLD 3] Syncing Classroom Template Protocols under '$SafeClassroomTemplatesRoot'..." -ForegroundColor Cyan

$ClassroomTemplatesRoot = Join-Path -Path $Root -ChildPath $SafeClassroomTemplatesRoot
New-Dir $ClassroomTemplatesRoot

$ClassroomFolders = @(
    "01_Classroom_Naming_Conventions",
    "02_Topic_Templates",
    "03_Class_Templates",
    "04_Teacher_Assignment_Records",
    "05_Classroom_Creation_Logs",
    "06_Posting_Activity_Reports"
)

foreach ($Folder in $ClassroomFolders) {
    $SafeFolder = ConvertTo-SafePathName $Folder
    New-Dir (Join-Path -Path $ClassroomTemplatesRoot -ChildPath $SafeFolder)
}

# Standard Naming Convention Folder References
$SafeNamingConvFolder = ConvertTo-SafePathName "01_Classroom_Naming_Conventions"
$SafeTopicTempFolder = ConvertTo-SafePathName "02_Topic_Templates"

# Populate Topics standard template
$TopicStandardMarkdown = @"
# Standardised Course Topics Template

These standardized sections correspond to the delivery layout rules for all Google Classrooms. No teacher may create or rename sections:

$($StandardClassroomTopics -join "`r`n")
"@
Set-Content -Path (Join-Path -Path $ClassroomTemplatesRoot -ChildPath "$SafeTopicTempFolder\standard_class_topics.md") -Value $TopicStandardMarkdown -Encoding UTF8 -Force

# Populate Naming Conventions guideline
$NamingMarkdown = @"
# Google Classroom Naming Conventions Standard

To maintain automatic SIS-to-LMS index synchronizations, all Classrooms must be generated by classroomadmin using the following explicit schema:

- $SelectedAcademicYear | Class X-A | English
- $SelectedAcademicYear | Class VI-B | Mathematics
- $SelectedAcademicYear | Class XII-C | Physics
"@
Set-Content -Path (Join-Path -Path $ClassroomTemplatesRoot -ChildPath "$SafeNamingConvFolder\classroom_naming_conventions.md") -Value $NamingMarkdown -Encoding UTF8 -Force

# ==============================================================================
# OTHER CORE MODULES: FORMS, DASHBOARDS, ORGANISATIONAL PLANNERS
# ==============================================================================
Write-Host "[CORE] Populating Forms Intake, Dashboard Data, and Organisational Planners..." -ForegroundColor Cyan

# 1. Forms Intake Buffer
$SafeFormsIntakeRoot = ConvertTo-SafePathName "Forms Intake"
$FormsIntakeRoot = Join-Path -Path $Root -ChildPath $SafeFormsIntakeRoot
New-Dir $FormsIntakeRoot

foreach ($Form in $Forms) {
    $SafeForm = ConvertTo-SafePathName $Form
    $FormPath = Join-Path -Path $FormsIntakeRoot -ChildPath $SafeForm
    New-Dir $FormPath
    New-Doc -Path (Join-Path -Path $FormPath -ChildPath "README.md") `
            -Title "$Form Intake Guidelines" `
            -Content "Teachers and staff submit responses via standard institutional forms. Automated scraping scripts parse files under this directory to feed executive dashboards in 'School Governance\05_Dashboard_Data'.`n`nOwner: principal + coordinators"
}

# 2. General Dashboard Data
$SafeDashboardDataGeneralRoot = ConvertTo-SafePathName "Dashboard Data"
$DashboardDataGeneralRoot = Join-Path -Path $Root -ChildPath $SafeDashboardDataGeneralRoot
New-Dir $DashboardDataGeneralRoot
New-Doc -Path (Join-Path -Path $DashboardDataGeneralRoot -ChildPath "README.md") `
        -Title "Consolidated District Dashboard Data Streams" `
        -Content "This location aggregates temporary buffers of PowerSchool CSV indices and teacher submission checklists.`n`nOwner: classroomadmin"

# 3. Org Structure
$SafeOrgStructureRoot = ConvertTo-SafePathName "Org Structure"
$OrgStructureRoot = Join-Path -Path $Root -ChildPath $SafeOrgStructureRoot
New-Dir $OrgStructureRoot

$OrgUnits = @(
    "01_Leadership",
    "02_NonTeaching",
    "03_Teaching_Staff",
    "04_Students",
    "05_Service_Accounts",
    "06_Alumni",
    "07_Suspended_Users",
    "08_Groups"
)

foreach ($Unit in $OrgUnits) {
    $SafeUnit = ConvertTo-SafePathName $Unit
    New-Dir (Join-Path -Path $OrgStructureRoot -ChildPath $SafeUnit)
}

# Org Structure - NonTeaching Units
$SafeNonTeaching = ConvertTo-SafePathName "02_NonTeaching"
$NonTeachingRoot = Join-Path -Path $OrgStructureRoot -ChildPath $SafeNonTeaching
$NonTeachingSectors = @("Admin_Office", "Accounts", "HR", "Front_Office", "IT", "Transport")
foreach ($Sector in $NonTeachingSectors) {
    $SafeSector = ConvertTo-SafePathName $Sector
    New-Dir (Join-Path -Path $NonTeachingRoot -ChildPath $SafeSector)
}

# Org Structure - Staff Stages
$SafeTeachingStaff = ConvertTo-SafePathName "03_Teaching_Staff"
$SafeStudents = ConvertTo-SafePathName "04_Students"
$TeachingStaffRoot = Join-Path -Path $OrgStructureRoot -ChildPath $SafeTeachingStaff
$StudentStaffRoot = Join-Path -Path $OrgStructureRoot -ChildPath $SafeStudents
$StagesSectors = @("PrePrimary", "Primary", "Middle", "Secondary", "SeniorSecondary")

foreach ($StageSec in $StagesSectors) {
    $SafeStageSec = ConvertTo-SafePathName $StageSec
    New-Dir (Join-Path -Path $TeachingStaffRoot -ChildPath $SafeStageSec)
    New-Dir (Join-Path -Path $StudentStaffRoot -ChildPath $SafeStageSec)
}

# Org Structure - Institutional Identities (Service Accounts)
$SafeServiceAccounts = ConvertTo-SafePathName "05_Service_Accounts"
$ServiceAccountsRoot = Join-Path -Path $OrgStructureRoot -ChildPath $SafeServiceAccounts
foreach ($Service in $ServiceAccounts) {
    $SafeService = ConvertTo-SafePathName $Service
    New-Doc -Path (Join-Path -Path $ServiceAccountsRoot -ChildPath "$SafeService`_.txt") `
            -Title "Service Account Entity: $SafeService@school.org" `
            -Content "Access restrictions and authorization keys mapped for the automated operations sync.`n`nOwner: principal"
}

# Org Structure - Unified Groups
$SafeGroups = ConvertTo-SafePathName "08_Groups"
$GroupsRoot = Join-Path -Path $OrgStructureRoot -ChildPath $SafeGroups
$SafeDeptGroups = ConvertTo-SafePathName "Department Groups"
$SafeTeacherGroups = ConvertTo-SafePathName "Teacher Groups"
$DeptGroupsRoot = Join-Path -Path $GroupsRoot -ChildPath $SafeDeptGroups
$TeacherGroupsRoot = Join-Path -Path $GroupsRoot -ChildPath $SafeTeacherGroups
New-Dir $DeptGroupsRoot
New-Dir $TeacherGroupsRoot

# Ensure clean domain names for standard organizational list output
$DeptGroupsListMapped = $DeptGroupsList | ForEach-Object {
    if ($_.Contains("@")) {
        if ($_.EndsWith("@")) { "$_`school.org" } else { $_ }
    } else {
        "$_`@school.org"
    }
}

foreach ($DeptGrp in $DeptGroupsList) {
    $SafeDeptGrp = ConvertTo-SafePathName $DeptGrp
    $FullAlias = if ($DeptGrp.EndsWith("@")) { "$DeptGrp`school.org" } else { $DeptGrp }
    New-Doc -Path (Join-Path -Path $DeptGroupsRoot -ChildPath "$SafeDeptGrp`school.org.md") `
            -Title "Alias Definition: $FullAlias" `
            -Content "This alias joins subject matter leads for administrative updates and lesson planning audits.`n`nOwner: academic.repository"
}

$TeacherGroupsListMapped = $TeacherGroupsList | ForEach-Object {
    if ($_.Contains("@")) {
        if ($_.EndsWith("@")) { "$_`school.org" } else { $_ }
    } else {
        "$_`@school.org"
    }
}

foreach ($TchrGrp in $TeacherGroupsList) {
    $SafeTchrGrp = ConvertTo-SafePathName $TchrGrp
    $FullAlias = if ($TchrGrp.EndsWith("@")) { "$TchrGrp`school.org" } else { $TchrGrp }
    New-Doc -Path (Join-Path -Path $TeacherGroupsRoot -ChildPath "$SafeTchrGrp`school.org.md") `
            -Title "Alias Definition: $FullAlias" `
            -Content "This alias includes teaching personnel belonging to $FullAlias alignment.`n`nOwner: principal"
}

# ==============================================================================
# MANIFEST GENERATOR
# ==============================================================================
Write-Host "[MANIFEST] Constructing robust schooly-drive-manifest.json & documentation..." -ForegroundColor Cyan

# Prepare fully-qualified identities
$IdentitiesPayload = [ordered]@{
    "academicRepository" = $InstitutionalIdentities["academicRepository"]
    "governance"         = $InstitutionalIdentities["governance"]
    "classroomAdmin"     = $InstitutionalIdentities["classroomAdmin"]
}

# Build rich, config-driven complete metadata manifest payload
$ManifestData = [ordered]@{
    "schemaId"               = "schooly-sdos-manifest"
    "schemaVersion"          = "2.0.0"
    "schoolName"             = $SchoolName
    "schoolCode"             = $SchoolCode
    "curriculum"             = $Curriculum
    "rootPath"               = $Root
    "academicYear"           = $SelectedAcademicYear
    "configSource"           = $ConfigSource
    "createdTimestamp"       = (Get-Date -Format "o")
    "academicRepositoryRoot" = $SafeAcademicRepositoryRoot
    "governanceRoot"         = $SafeGovernanceRoot
    "classroomTemplatesRoot" = $SafeClassroomTemplatesRoot
    "formsIntakeRoot"        = $SafeFormsIntakeRoot
    "orgStructureRoot"       = $SafeOrgStructureRoot
    "institutionalIdentities"= $IdentitiesPayload
    "serviceAccounts"        = $ServiceAccounts
    "departmentGroups"       = $DeptGroupsListMapped
    "teacherGroups"          = $TeacherGroupsListMapped
    "standardClassroomTopics"= $StandardClassroomTopics
    "repositoryStages"       = $Stages
    "repositoryClasses"      = $StageClasses
    "repositorySections"     = $Sections
    "repositorySubjects"     = $StageSubjects
    "subjectArtifactFolders" = $SubjectArtifactFolders
    "governanceFolders"      = $GovFolders
    "formsIntakeCategories"  = $Forms
    "dashboardModules"       = $DashboardModules
    "pathSafetyMode"         = "Windows-Safe-Normalized"
}

$ManifestJsonPath = Join-Path -Path $Root -ChildPath "schooly-drive-manifest.json"
$ManifestJson = ConvertTo-Json -InputObject $ManifestData -Depth 100
Set-Content -Path $ManifestJsonPath -Value $ManifestJson -Encoding UTF8 -Force

# Create Drive Structure documentation markdown
$ExplainerMarkdown = @"
# School Digital Operating System — Drive Structure Map

Generated on: $(Get-Date -Format "F")
School Name : $SchoolName ($SchoolCode)
Curriculum  : $Curriculum
Academic Year: $SelectedAcademicYear
Root Location: $Root
Configuration Source: $ConfigSource

This folder structure forms the foundation of target enterprise automation, decoupling knowledge preservation, student-facing deliveries, and executive audit surveillance:

## 1. Three Institutional Worlds Architecture Outline
- **Academic Repository (Knowledge Base)**
  - Owner ID: \`$($InstitutionalIdentities["academicRepository"])\`
  - Audience: Teachers and Coordinators (Academic Alignment).
  - Scope: Intellectual capital repository structured by stage, classes, and subjects.
  - RULE: Students are never granted access under this folder.

- **Google Classroom (Teaching & Learning Delivery Layer)**
  - Owner ID: \`$($InstitutionalIdentities["classroomAdmin"])\`
  - Audience: Teachers and Students.
  - Scope: Interactive, real-time rosters, classroom assignments, announcements, and materials mapping.
  - RULE: Only admins create classrooms and topics. Teachers must utilize template topic definitions.

- **School Governance (Administration & Metrics Surveillance)**
  - Owner ID: \`$($InstitutionalIdentities["governance"])\`
  - Audience: Principal, VP, Registrars, and Advisors.
  - Scope: Dashboard inputs, audit log entries, policies validation compliance records, and improvement plans.

## 2. Directory Taxonomy Definition Breakdown
- **Academic Repository** / \`$SelectedAcademicYear\` / [Stages] / [Classes] / [Sections] / [Subjects] / [Artifacts]
  - *Stages*: $($Stages -join ", ").
  - *Standard Artifacts*: $($SubjectArtifactFolders -join ", ").
- **School Governance**: Internal compliance archives ($($GovFolders -join ", ")).
- **Google Classroom Templates**: Standard instructional blueprints and topics conventions.
- **Forms Intake**: Scrape buffers mapping operational indicators ($($Forms -join ", ")).
- **Org Structure**: Corporate identity schema defining service accounts, academic aliases and human relations directories.

---
*Created automatically by Schooly AI Enterprise Drive Engine.*
"@
$StructureMdPath = Join-Path -Path $Root -ChildPath "schooly-drive-structure.md"
Set-Content -Path $StructureMdPath -Value $ExplainerMarkdown -Encoding UTF8 -Force

# Fix the original script variable typo ($ prefix) and compile standard root files
$WriteDocReadme = @(
  "This root directory serves as the unified School Digital Operating System Local Drive Workspace.",
  "It has been fully provisioned and mapped structure-wise according to curriculum rules in '$ConfigSource'.",
  "Refer to 'schooly-drive-structure.md' for index details and permission constraints."
) -join "`r`n`r`n"

New-Doc -Path (Join-Path -Path $Root -ChildPath "README.md") -Title "School Digital Operating System Local Workspace" -Content $WriteDocReadme

Write-Host "==========================================================" -ForegroundColor Green
Write-Host " SUCCESS: Operational system drive layouts built safely!" -ForegroundColor Green
Write-Host " Manifest File location: $ManifestJsonPath" -ForegroundColor Green
Write-Host " Document Map location: $StructureMdPath" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
