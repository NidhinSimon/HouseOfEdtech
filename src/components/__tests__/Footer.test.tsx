import { render, screen } from '@testing-library/react';
import { Footer } from '../Footer';

describe('Footer Component', () => {
  it('renders the author name', () => {
    render(<Footer />);
    expect(screen.getByText(/Built by/i)).toBeInTheDocument();
    expect(screen.getByText('Nidhin')).toBeInTheDocument();
  });

  it('contains a link to the GitHub profile', () => {
    render(<Footer />);
    const githubLink = screen.getByText(/GitHub Profile/i);
    expect(githubLink).toBeInTheDocument();
    expect(githubLink.closest('a')).toHaveAttribute('href', 'https://github.com/NidhinSimon');
  });

  it('contains a link to the LinkedIn profile', () => {
    render(<Footer />);
    const linkedinLink = screen.getByText(/LinkedIn Profile/i);
    expect(linkedinLink).toBeInTheDocument();
    expect(linkedinLink.closest('a')).toHaveAttribute('href', 'https://www.linkedin.com/in/nidhinsimon/');
  });
});
