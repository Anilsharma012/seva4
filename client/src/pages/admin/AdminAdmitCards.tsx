import { useEffect, useState, useRef } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { IdCard, Plus, Search, Download, Loader2, Users } from "lucide-react";

interface Student {
  _id: string;
  registrationNumber: string;
  rollNumber?: string;
  fullName: string;
  fatherName?: string;
  class: string;
  feePaid: boolean;
}

interface AdmitCard {
  _id: string;
  studentId: {
    _id: string;
    fullName: string;
    fatherName?: string;
    rollNumber?: string;
    registrationNumber: string;
    class: string;
  };
  examName: string;
  fileUrl: string;
  fileName: string;
  uploadedAt: string;
}

export default function AdminAdmitCards() {
  const [students, setStudents] = useState<Student[]>([]);
  const [admitCards, setAdmitCards] = useState<AdmitCard[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const admitCardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    studentId: "",
    examName: "Haryana GK Exam 2025",
    examDate: "",
    examTime: "10:00 AM - 12:00 PM",
    examCenter: "",
    session: "",
  });

  const [bulkFormData, setBulkFormData] = useState({
    targetClass: "all",
    classSequence: "all",
    examName: "Haryana GK Exam 2025",
    examDate: "",
    examTime: "10:00 AM - 12:00 PM",
    examCenter: "",
    session: "",
  });

  const classSequences = [
    { id: "all", name: "All Classes", classes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
    { id: "1-3", name: "Classes 1-3", classes: [1, 2, 3] },
    { id: "4-6", name: "Classes 4-6", classes: [4, 5, 6] },
    { id: "7-8", name: "Classes 7-8", classes: [7, 8] },
    { id: "9-10", name: "Classes 9-10", classes: [9, 10] },
    { id: "11-12", name: "Classes 11-12", classes: [11, 12] },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      
      const studentsRes = await fetch("/api/students", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setStudents(studentsData);
      }

      const admitCardsRes = await fetch("/api/admit-cards", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (admitCardsRes.ok) {
        const admitCardsData = await admitCardsRes.json();
        setAdmitCards(admitCardsData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const student = students.find(s => s._id === formData.studentId);
      if (!student) return;

      const fileData = JSON.stringify({
        examName: formData.examName,
        examDate: formData.examDate,
        examTime: formData.examTime,
        examCenter: formData.examCenter,
        session: formData.session,
        generatedAt: new Date().toISOString(),
      });

      const res = await fetch("/api/admit-cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: formData.studentId,
          examName: formData.examName,
          fileUrl: fileData,
          fileName: `admit_card_${student.rollNumber || student.registrationNumber}.json`,
          session: formData.session,
        }),
      });

      if (!res.ok) throw new Error("Failed to create admit card");

      toast({ title: "Admit Card Generated", description: `${student.fullName}` });
      setIsAddDialogOpen(false);
      setFormData({ studentId: "", examName: "Haryana GK Exam 2025", examDate: "", examTime: "10:00 AM - 12:00 PM", examCenter: "", session: "" });
      loadData();
    } catch (error) {
      console.error("Error generating admit card:", error);
      toast({ title: "Error", description: "Failed to generate admit card", variant: "destructive" });
    }
  };

  const handleBulkGenerate = async () => {
    setGenerating(true);
    const token = localStorage.getItem("auth_token");

    // Get the selected sequence or use individual class selection
    let selectedClasses: number[] = [];
    if (bulkFormData.classSequence !== "all" && bulkFormData.classSequence !== "custom") {
      const sequence = classSequences.find(seq => seq.id === bulkFormData.classSequence);
      selectedClasses = sequence?.classes || [];
    } else if (bulkFormData.classSequence === "custom" && bulkFormData.targetClass !== "all") {
      selectedClasses = [parseInt(bulkFormData.targetClass)];
    }

    const targetStudents = students.filter(s => {
      if (!s.rollNumber) return false;
      if (selectedClasses.length > 0) {
        return selectedClasses.includes(parseInt(s.class));
      }
      return true;
    });

    const existingStudentIds = new Set(admitCards.map(ac => ac.studentId?._id));
    const studentsToGenerate = targetStudents.filter(s => !existingStudentIds.has(s._id));

    let generated = 0;
    let failed = 0;

    for (const student of studentsToGenerate) {
      const fileData = JSON.stringify({
        examName: bulkFormData.examName,
        examDate: bulkFormData.examDate,
        examTime: bulkFormData.examTime,
        examCenter: bulkFormData.examCenter,
        session: bulkFormData.session,
        generatedAt: new Date().toISOString(),
      });

      try {
        const res = await fetch("/api/admit-cards", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            studentId: student._id,
            examName: bulkFormData.examName,
            fileUrl: fileData,
            fileName: `admit_card_${student.rollNumber || student.registrationNumber}.json`,
            session: bulkFormData.session,
            classSequence: bulkFormData.classSequence,
          }),
        });

        if (res.ok) generated++;
        else failed++;
      } catch {
        failed++;
      }
    }

    setGenerating(false);
    toast({ 
      title: "Bulk Generation Complete", 
      description: `Generated: ${generated}, Failed: ${failed}` 
    });
    
    setIsBulkDialogOpen(false);
    setBulkFormData({ targetClass: "all", classSequence: "all", examName: "Haryana GK Exam 2025", examDate: "", examTime: "10:00 AM - 12:00 PM", examCenter: "" });
    loadData();
  };

  const handleDownload = (ac: AdmitCard) => {
    const admitData = parseAdmitCardData(ac.fileUrl);
    const student = ac.studentId;

    const admitCardHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Admit Card - ${student.fullName}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 2px solid #c00; padding-bottom: 15px; margin-bottom: 20px; }
    .logo { width: 80px; height: 80px; }
    .title { color: #c00; font-size: 24px; font-weight: bold; margin: 10px 0; }
    .subtitle { color: #666; font-size: 14px; }
    .admit-title { background: #c00; color: white; padding: 10px; text-align: center; font-size: 18px; font-weight: bold; margin: 20px 0; }
    .details { display: flex; gap: 30px; margin: 20px 0; }
    .details-left { flex: 1; }
    .details-right { width: 120px; height: 150px; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; color: #999; }
    .row { display: flex; margin: 10px 0; }
    .label { font-weight: bold; width: 150px; }
    .value { flex: 1; }
    .exam-info { background: #f5f5f5; padding: 15px; margin: 20px 0; }
    .exam-info h3 { margin: 0 0 10px 0; color: #333; }
    .instructions { margin-top: 20px; padding: 15px; border: 1px solid #ddd; }
    .instructions h3 { margin: 0 0 10px 0; }
    .instructions ul { margin: 0; padding-left: 20px; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
    .signature { margin-top: 40px; text-align: right; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">Manav Welfare Seva Society</div>
    <div class="subtitle">मानव वेलफेयर सेवा सोसायटी, भुना (हरियाणा)</div>
    <div class="subtitle">Reg. No: 01215 | Phone: +91 98126 76818</div>
  </div>
  
  <div class="admit-title">ADMIT CARD / प्रवेश पत्र</div>
  
  <div class="details">
    <div class="details-left">
      <div class="row"><span class="label">Roll Number:</span><span class="value">${student.rollNumber || 'N/A'}</span></div>
      <div class="row"><span class="label">Registration No:</span><span class="value">${student.registrationNumber}</span></div>
      <div class="row"><span class="label">Student Name:</span><span class="value">${student.fullName}</span></div>
      <div class="row"><span class="label">Father's Name:</span><span class="value">${student.fatherName || 'N/A'}</span></div>
      <div class="row"><span class="label">Class:</span><span class="value">${student.class}</span></div>
    </div>
    <div class="details-right">Photo</div>
  </div>
  
  <div class="exam-info">
    <h3>Exam Details / परीक्षा विवरण</h3>
    <div class="row"><span class="label">Exam Name:</span><span class="value">${admitData?.examName || ac.examName}</span></div>
    <div class="row"><span class="label">Exam Date:</span><span class="value">${admitData?.examDate || 'To be announced'}</span></div>
    <div class="row"><span class="label">Exam Time:</span><span class="value">${admitData?.examTime || 'To be announced'}</span></div>
    <div class="row"><span class="label">Exam Center:</span><span class="value">${admitData?.examCenter || 'To be announced'}</span></div>
  </div>
  
  <div class="instructions">
    <h3>Important Instructions / महत्वपूर्ण निर्देश:</h3>
    <h4 style="margin-top: 10px; font-weight: bold; color: #333;">English:</h4>
    <ul>
      <li>This is an important admit card. Keep it safe.</li>
      <li>Bring this admit card to the examination center along with a valid photo ID.</li>
      <li>Arrive at the examination center at least 30 minutes before the exam starts.</li>
      <li>Electronic devices, mobile phones, and calculators are NOT allowed in the exam hall.</li>
      <li>Follow all instructions given by the exam invigilator.</li>
      <li>Maintain discipline and decorum during the examination.</li>
    </ul>
    <h4 style="margin-top: 15px; font-weight: bold; color: #333;">हिन्दी:</h4>
    <ul>
      <li>यह एक महत्वपूर्ण प्रवेश पत्र है। इसे सुरक्षित रखें।</li>
      <li>इस प्रवेश पत्र को एक वैध फोटो आईडी के साथ परीक्षा केंद्र पर लाएं।</li>
      <li>परीक्षा शुरू होने से कम से कम 30 मिनट पहले परीक्षा केंद्र पर पहुंचें।</li>
      <li>परीक्षा हॉल में इलेक्ट्रॉनिक उपकरण, मोबाइल फोन और कैलकुलेटर की अनुमति नहीं है।</li>
      <li>परीक्षा पर्यवेक्षक द्वारा दिए गए सभी निर्देशों का पालन करें।</li>
      <li>परीक्षा के दौरान अनुशासन और शालीनता बनाए रखें।</li>
    </ul>
  </div>
  
  <div class="signature">
    <p>_____________________</p>
    <p>Authorized Signature</p>
    <p>अधिकृत हस्ताक्षर</p>
  </div>
  
  <div class="footer">
    <p>This is a computer generated admit card</p>
    <p>यह कंप्यूटर जनित प्रवेश पत्र है</p>
  </div>
</body>
</html>`;

    const blob = new Blob([admitCardHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admit_card_${student.rollNumber || student.registrationNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({ title: "Downloaded", description: "Admit card downloaded. Open in browser and print." });
  };

  const parseAdmitCardData = (url: string) => {
    try {
      return JSON.parse(url);
    } catch {
      return null;
    }
  };

  const getClassCounts = () => {
    const counts: Record<string, number> = {};
    admitCards.forEach(ac => {
      const cls = ac.studentId?.class || "Unknown";
      counts[cls] = (counts[cls] || 0) + 1;
    });
    return counts;
  };

  const classCounts = getClassCounts();

  const eligibleStudents = students.filter(s => s.rollNumber);
  const filteredEligibleStudents = classFilter === "all" ? eligibleStudents : eligibleStudents.filter(s => s.class === classFilter);
  
  const filteredAdmitCards = admitCards.filter(ac => {
    const matchesSearch = ac.studentId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ac.studentId?.rollNumber?.includes(searchTerm);
    const matchesClass = classFilter === "all" || ac.studentId?.class === classFilter;
    return matchesSearch && matchesClass;
  });

  const studentsWithoutAdmitCard = () => {
    const existingStudentIds = new Set(admitCards.map(ac => ac.studentId?._id));
    return filteredEligibleStudents.filter(s => !existingStudentIds.has(s._id)).length;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <IdCard className="h-8 w-8 text-purple-600" />
              Admit Cards
            </h1>
            <p className="text-muted-foreground">एडमिट कार्ड प्रबंधन - Total: {admitCards.length}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-bulk-generate">
                  <Users className="h-4 w-4 mr-2" />
                  Bulk Generate
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bulk Generate Admit Cards / सभी के लिए बनाएं</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Class Sequence / कक्षा अनुक्रम</Label>
                    <Select value={bulkFormData.classSequence} onValueChange={(v) => setBulkFormData({ ...bulkFormData, classSequence: v })}>
                      <SelectTrigger data-testid="select-bulk-sequence">
                        <SelectValue placeholder="Select Sequence" />
                      </SelectTrigger>
                      <SelectContent>
                        {classSequences.map(seq => (
                          <SelectItem key={seq.id} value={seq.id}>{seq.name}</SelectItem>
                        ))}
                        <SelectItem value="custom">Custom Class</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {bulkFormData.classSequence === "custom" && (
                    <div className="space-y-2">
                      <Label>Select Specific Class</Label>
                      <Select value={bulkFormData.targetClass} onValueChange={(v) => setBulkFormData({ ...bulkFormData, targetClass: v })}>
                        <SelectTrigger data-testid="select-bulk-class">
                          <SelectValue placeholder="Choose Class" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1,2,3,4,5,6,7,8,9,10,11,12].map(c => (
                            <SelectItem key={c} value={c.toString()}>Class {c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Exam Name</Label>
                    <Input 
                      value={bulkFormData.examName} 
                      onChange={(e) => setBulkFormData({ ...bulkFormData, examName: e.target.value })}
                      placeholder="Haryana GK Exam 2025"
                      data-testid="input-bulk-exam-name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Exam Date</Label>
                      <Input 
                        type="date"
                        value={bulkFormData.examDate} 
                        onChange={(e) => setBulkFormData({ ...bulkFormData, examDate: e.target.value })}
                        data-testid="input-bulk-exam-date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Exam Time</Label>
                      <Input 
                        value={bulkFormData.examTime} 
                        onChange={(e) => setBulkFormData({ ...bulkFormData, examTime: e.target.value })}
                        placeholder="10:00 AM - 12:00 PM"
                        data-testid="input-bulk-exam-time"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Exam Center</Label>
                    <Input 
                      value={bulkFormData.examCenter} 
                      onChange={(e) => setBulkFormData({ ...bulkFormData, examCenter: e.target.value })}
                      placeholder="परीक्षा केंद्र"
                      data-testid="input-bulk-exam-center"
                    />
                  </div>
                  <Button onClick={handleBulkGenerate} className="w-full" disabled={generating} data-testid="button-generate-bulk">
                    {generating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {(() => {
                      const sequence = classSequences.find(seq => seq.id === bulkFormData.classSequence);
                      const count = students.filter(s => {
                        if (!s.rollNumber) return false;
                        if (!sequence) return true;
                        return sequence.classes.includes(parseInt(s.class));
                      }).filter(s => !new Set(admitCards.map(ac => ac.studentId?._id)).has(s._id)).length;
                      return `Generate for ${sequence?.name || 'All Classes'} (${count} students)`;
                    })()}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-admit-card"><Plus className="h-4 w-4 mr-2" />Create Admit Card</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Admit Card</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Select Student</Label>
                    <Select value={formData.studentId} onValueChange={(v) => setFormData({ ...formData, studentId: v })}>
                      <SelectTrigger data-testid="select-student"><SelectValue placeholder="छात्र चुनें" /></SelectTrigger>
                      <SelectContent>
                        {filteredEligibleStudents.map(s => (
                          <SelectItem key={s._id} value={s._id}>
                            {s.fullName} (Roll: {s.rollNumber}, Class: {s.class})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Exam Name</Label>
                    <Input 
                      value={formData.examName} 
                      onChange={(e) => setFormData({ ...formData, examName: e.target.value })}
                      placeholder="Haryana GK Exam 2025"
                      data-testid="input-exam-name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Exam Date</Label>
                      <Input 
                        type="date"
                        value={formData.examDate} 
                        onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                        data-testid="input-exam-date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Exam Time</Label>
                      <Input 
                        value={formData.examTime} 
                        onChange={(e) => setFormData({ ...formData, examTime: e.target.value })}
                        placeholder="10:00 AM - 12:00 PM"
                        data-testid="input-exam-time"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Exam Center</Label>
                    <Input 
                      value={formData.examCenter} 
                      onChange={(e) => setFormData({ ...formData, examCenter: e.target.value })}
                      placeholder="परीक्षा केंद्र"
                      data-testid="input-exam-center"
                    />
                  </div>
                  <Button onClick={handleSubmit} className="w-full" data-testid="button-generate-admit-card">Generate Admit Card</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Object.entries(classCounts).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).map(([cls, count]) => (
            <Card key={cls} className={`cursor-pointer hover-elevate ${classFilter === cls ? 'ring-2 ring-primary' : ''}`} onClick={() => setClassFilter(classFilter === cls ? "all" : cls)}>
              <CardContent className="p-3 text-center">
                <p className="text-lg font-bold">Class {cls}</p>
                <p className="text-2xl font-bold text-purple-600">{count}</p>
                <p className="text-xs text-muted-foreground">admit cards</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by name or roll number..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search"
                />
              </div>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="w-40" data-testid="select-class-filter">
                  <SelectValue placeholder="Filter by Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(c => (
                    <SelectItem key={c} value={c.toString()}>Class {c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {classFilter === "all" ? "All Admit Cards" : `Class ${classFilter} Admit Cards`} ({filteredAdmitCards.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll No.</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Father's Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Exam</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Center</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdmitCards.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No admit cards found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAdmitCards.map((ac) => {
                      const admitData = parseAdmitCardData(ac.fileUrl);
                      return (
                        <TableRow key={ac._id} data-testid={`row-admit-card-${ac._id}`}>
                          <TableCell className="font-medium">{ac.studentId?.rollNumber}</TableCell>
                          <TableCell>{ac.studentId?.fullName}</TableCell>
                          <TableCell>{ac.studentId?.fatherName || "-"}</TableCell>
                          <TableCell>Class {ac.studentId?.class}</TableCell>
                          <TableCell>{ac.examName}</TableCell>
                          <TableCell>{admitData?.examDate || "TBD"}</TableCell>
                          <TableCell>{admitData?.examCenter || "TBD"}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => handleDownload(ac)} data-testid={`button-download-${ac._id}`}>
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
