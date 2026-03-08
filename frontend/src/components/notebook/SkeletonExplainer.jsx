/**
 * SkeletonExplainer — explains the algorithms and logic in the skeleton code.
 */

import ReactMarkdown from "react-markdown";
import { FiCpu } from "react-icons/fi";

export default function SkeletonExplainer({ explanation }) {
    if (!explanation) {
        return (
            <p className="text-sm text-text-muted">
                Skeleton analysis will be available after processing.
            </p>
        );
    }

    return (
        <div>
            <div className="flex items-center gap-2 mb-3">
                <FiCpu size={14} className="text-skeleton" />
                <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Logical Core Analysis
                </h4>
            </div>
            <div className="prose prose-invert prose-sm max-w-none text-text-secondary leading-relaxed [&_p]:mb-2 [&_strong]:text-text-primary [&_code]:text-accent [&_code]:text-xs [&_ul]:pl-4 [&_li]:mb-1 [&_h3]:text-text-primary [&_h3]:text-sm [&_h3]:mt-4 [&_h3]:mb-2">
                <ReactMarkdown>{explanation}</ReactMarkdown>
            </div>
        </div>
    );
}
