import { useState, useEffect } from "react";
import { Plus, Search, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { userApi } from "@/services/api/users";
import type { User } from "@/types";

interface AddStudentFormProps {
  onAddStudent: (user: User) => void;
  currentClassStudents: { id: string }[];
}

export function AddStudentForm({ onAddStudent, currentClassStudents }: AddStudentFormProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [initialStudents, setInitialStudents] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Fetch initial learners suggestions
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const response = await userApi.getLearners();
        // Handle paginated response structure if needed, assuming response.data is the array
        // If response itself is pagination object:
        const users = (response as any).data || response; 
        if (Array.isArray(users)) {
             setInitialStudents(users);
        }
      } catch (err) {
        console.error("Failed to load initial students", err);
      }
    };
    fetchInitial();
  }, []);

  // Simple debounce implementation
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    const doSearch = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const users = await userApi.searchUsers({ query: debouncedQuery });
        // Filter out non-learners if needed, but searchUsers might already do this
        setResults(users);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsSearching(false);
      }
    };

    doSearch();
  }, [debouncedQuery]);

  const isEnrolled = (userId: string) => {
    return currentClassStudents.some(s => s.id === userId);
  };

  const displayList = query.trim() ? results : initialStudents;

  return (
    <Card className="h-fit shadow-sm border-slate-200">
      <CardHeader>
        <CardTitle>Add Student</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Search Student</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="pl-9 h-10 border-slate-300"
            />
          </div>
        </div>

        <div className="space-y-2 min-h-[200px] max-h-[400px] overflow-y-auto">
          {isSearching && <p className="text-sm text-slate-500 text-center py-4">Searching...</p>}
          
          {!isSearching && query && results.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-4">No students found.</p>
          )}

          {!isSearching && !query && displayList.length === 0 && (
             <p className="text-sm text-slate-500 text-center py-4">Start typing to search...</p>
          )}

          {!isSearching && displayList.map(user => {
            const enrolled = isEnrolled(user.id);
            const name = (user.firstName && user.lastName) 
                ? `${user.firstName} ${user.lastName}` 
                : (user.name || user.email.split('@')[0]);

            return (
              <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                <div className="flex gap-3 items-center overflow-hidden">
                   <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold shrink-0">
                      {user.avatar ? <img src={user.avatar} className="h-full w-full rounded-full object-cover"/> : name[0]}
                   </div>
                   <div className="flex flex-col overflow-hidden">
                     <p className="text-sm font-medium text-slate-900 truncate">{name}</p>
                     <p className="text-xs text-slate-500 truncate">{user.email}</p>
                   </div>
                </div>
                
                {enrolled ? (
                   <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                     <Check size={12} /> Enrolled
                   </span>
                ) : (
                   <Button 
                      size="sm" 
                      className="h-8 w-8 p-0 bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() => onAddStudent(user)}
                   >
                      <Plus size={16} />
                   </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default AddStudentForm;

