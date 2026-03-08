/**
 * FileContext — shows the file's role within the project architecture.
 */

import ReactMarkdown from "react-markdown";
import { FiMapPin } from "react-icons/fi";

export default function FileContext({ fileContext }) {
    if (!fileContext) {
        return (
            <p className="text-sm text-text-muted">
                File context will be available after analysis completes.
            </p>
        );
    }

    return (
        <div>
            <div className="flex items-center gap-2 mb-3">
                <FiMapPin size={14} className="text-accent" />
                <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Role in Project
                </h4>
            </div>
            <div className="prose prose-invert prose-sm max-w-none text-text-secondary leading-relaxed [&_p]:mb-2 [&_strong]:text-text-primary [&_code]:text-accent [&_code]:text-xs [&_ul]:pl-4">
                <ReactMarkdown>{fileContext}</ReactMarkdown>
            </div>
        </div>
    );
}
